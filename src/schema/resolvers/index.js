const path = require('path')
const _ = require('lodash')
const fs = require('fs')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const folders = require('../../functions/folder')
const files = require('../../functions/file')
const database = require('../../functions/database')

const getFolderSize = require('../../utils/getFolderSize')
const { getRelFilePath, repoDir } = require('../../utils/parsePath')
const { checkoutBranch } = require('./../../functions/git.js')

const resolvers = {
	Result: {
		__resolveType: obj => {
			if (obj.error) return 'Error'
			if (obj.message) return 'Success'
			return null
		},
	},
	Query: {
		getNestedFolders: async (_, args) => {
			if (fs.existsSync(args.path)) {
				const data = await folders
					.getNestedFolders(args.path)
					.then(response => response)
				const folderSize = await getFolderSize(args.path)
					.map(file => fs.readFileSync(file))
					.join('\n')
				const withParent = {
					name: path.parse(args.path).name,
					type: 'folder',
					path: args.path,
					children: data,
					size: folderSize.length,
					createdAt: fs.statSync(args.path).birthtime,
				}
				return withParent
			}
			return new Error('ENOENT')
		},
		getFolderWithFiles: async (_, args) => {
			if (fs.existsSync(args.path)) {
				const data = await folders
					.getFolderWithFiles(args.path)
					.then(response => response)
				const folderSize = await getFolderSize(args.path)
					.map(file => fs.readFileSync(file))
					.join('\n')
				const withParent = {
					name: path.parse(args.path).name,
					type: 'folder',
					path: args.path,
					size: folderSize.length,
					children: data,
					createdAt: fs.statSync(args.path).birthtime,
				}
				return withParent
			}
			return new Error('ENOENT')
		},
		getFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.getFile(args.path)
					.then(success => success)
					.catch(failure => new Error(failure))
			}
			return new Error('ENOENT')
		},
		searchFiles: (_, args) =>
			files
				.searchFiles(args.fileName)
				.then(data => data)
				.catch(e => e),
		getCommitLog: (_, { path: repoDir }) => {
			return git
				.log({
					dir: repoDir,
					depth: 10,
					ref: 'master',
				})
				.then(list => list)
				.catch(error => new Error(error))
		},
		getCommit: (_, { id, path: repoDir }) => {
			return git
				.readObject({
					dir: repoDir,
					oid: id,
				})
				.then(({ object }) => object)
				.catch(error => new Error(error))
		},
		getCommits: async (_, { path, commits }) => {
			const results = await commits.map(commit =>
				git
					.readObject({
						dir: path,
						oid: commit,
					})
					.then(({ object }) => object)
					.catch(error => new Error(error))
			)
			return Promise.all(results).then(data => data)
		},
		getCommitContent: (_, { id, path }) => {
			return git
				.readObject({
					dir: repoDir(path),
					oid: id,
					filepath: getRelFilePath(path),
					encoding: 'utf8',
				})
				.then(({ object }) => object)
				.catch(error => new Error(error))
		},
		showFilesInBranch: (_, { branchName, appName, entity }) => {
			return checkoutBranch(
				branchName,
				'./../apps/' + appName + '/data/' + entity
			)
				.then(() => {
					return resolvers.Query.getFolderWithFiles('', {
						path: './../apps/' + appName + '/data/' + entity,
					}).then(data => {
						return data
					})
				})
				.then(data => {
					checkoutBranch(
						'master',
						'./../apps/' + appName + '/data/' + entity
					)
					return data
				})
		},
	},
	Mutation: {
		installApp: async (_, args) => {
			let docId = ''

			// Add the app to installed list in DB
			const options = {
				name: args.name,
				...(args.schemas && {
					entities: JSON.parse(args.schemas).schemas.map(
						schema => schema.path
					),
				}),
			}
			await database.createApp(options).then(result => {
				docId = result.id
			})

			// Hybrid App
			if (args.type === 'hybrid') {
				const appPath = `./../apps/${args.name}`
				const dataFolders = []
				const schemaFolders = []
				const { schemas } = JSON.parse(args.schemas)
				const { apps } = JSON.parse(args.apps)

				// Update the deps of extended app.
				await database.updateApp(apps, docId)

				// Add Schema, Data Folder Paths
				const addPaths = await schemas.map(folder => {
					schemaFolders.push(`${appPath}/schema/${folder.path}`)
					dataFolders.push(`${appPath}/data/${folder.path}`)
				})

				// Create data folders and initialize git
				const addDatas = await dataFolders.map(path =>
					folders
						.createFolder(path)
						.then(() => git.init({ dir: path }))
						.catch(error => ({
							success: false,
							error: new Error(error),
						}))
				)

				const folderPath = (folderName, folderPath) =>
					`${appPath}/${folderName}/${folderPath}`

				// Create Folders with Schema Entity Files
				const addSchemas = await schemaFolders.map(path =>
					folders
						.createFolder(path)
						.then(() => {
							return schemas.map(folder => {
								return folder.entities.map(file => {
									const filepath = `${folderPath(
										'schema',
										folder.path
									)}/${file.name}.json`
									return fs.writeFile(
										filepath,
										JSON.stringify(file.content, null, 2),
										error => {
											if (error)
												return {
													success: false,
													error: new Error(error),
												}
										}
									)
								})
							})
						})
						.catch(error => ({
							success: false,
							error: new Error(error),
						}))
				)

				// Update the parent app's dependencies
				const extendSchemas = await apps.map(app => {
					return app.entities.map(entity => {
						const path = `./../apps/${app.name}/schema/${entity.name}/ext.${args.name}.json`
						return fs.writeFile(
							path,
							JSON.stringify(entity.schema, null, 2),
							error => {
								if (error) return new Error(error)
							}
						)
					})
				})

				return Promise.all([
					addPaths,
					addDatas,
					addSchemas,
					extendSchemas,
				]).then(() => ({
					success: true,
					message: `App ${args.name} is installed!`,
				}))
			}
			// Independent App
			if (args.type === 'independent') {
				const appPath = `./../apps/${args.name}`
				const dataFolders = []
				const schemaFolders = []
				const { schemas } = JSON.parse(args.schemas)

				// Add Schema, Data Folder Paths
				const addPaths = await schemas.map(folder => {
					schemaFolders.push(`${appPath}/schema/${folder.path}`)
					dataFolders.push(`${appPath}/data/${folder.path}`)
				})

				// Create data folders and initialize git
				const addDatas = await dataFolders.map(path =>
					folders
						.createFolder(path)
						.then(() => git.init({ dir: path }))
						.catch(error => ({
							success: false,
							error: new Error(error),
						}))
				)

				const folderPath = (folderName, folderPath) =>
					`${appPath}/${folderName}/${folderPath}`

				// Create Folders with Schema Entity Files
				const addSchemas = await schemaFolders.map(path =>
					folders
						.createFolder(path)
						.then(() => {
							return schemas.map(folder => {
								return folder.entities.map(file => {
									const filepath = `${folderPath(
										'schema',
										folder.path
									)}/${file.name}.json`
									return fs.writeFile(
										filepath,
										JSON.stringify(file.content, null, 2),
										error => {
											if (error)
												return {
													success: false,
													error: new Error(error),
												}
										}
									)
								})
							})
						})
						.catch(error => ({
							success: false,
							error: new Error(error),
						}))
				)

				return Promise.all([addPaths, addDatas, addSchemas]).then(
					() => ({
						success: true,
						message: `App ${args.name} is installed!`,
					})
				)
			}
			// Dependent App
			if (args.type === 'dependent') {
				const { apps } = JSON.parse(args.apps)
				// Update the deps of extended app.
				await database.updateApp(apps, docId)

				// Update the parent app's dependencies
				const addSchemas = await apps.map(app => {
					return app.entities.map(entity => {
						const path = `./../apps/${app.name}/schema/${entity.name}/ext.${args.name}.json`
						return fs.writeFile(
							path,
							JSON.stringify(entity.schema, null, 2),
							error => {
								if (error) return new Error(error)
							}
						)
					})
				})

				return Promise.all(addSchemas).then(() => ({
					success: true,
					message: `App ${args.name} is installed!`,
				}))
			}
		},
		createFolder: (_, args) => {
			if (fs.existsSync(args.path)) {
				return {
					success: false,
					error: `Folder ${path.basename(args.path)} already exists!`,
				}
			} else {
				return folders
					.createFolder(args.path)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
		},
		deleteFolder: (_, args) => {
			if (fs.existsSync(args.path)) {
				return folders
					.deleteFolder(args.path)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `Folder ${path.basename(args.path)} doesn't exists!`,
			}
		},
		renameFolder: (_, args) => {
			if (fs.existsSync(args.oldPath)) {
				return folders
					.renameFolder(args.oldPath, args.newPath)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `Folder ${path.basename(args.oldPath)} doesn't exists!`,
			}
		},
		createFile: (_, args) => {
			if (fs.existsSync(args.path)) {
				return {
					success: false,
					error: `File ${path.basename(args.path)} already exists!`,
				}
			}
			return files
				.createFile(args)
				.then(response => ({
					success: true,
					message: response,
				}))
				.catch(failure => ({
					success: false,
					error: new Error(failure),
				}))
		},
		deleteFile: (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.deleteFile(args.path)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `File ${path.basename(args.path)} doesn't exists!`,
			}
		},
		updateFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.updateFile(args)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `File ${path.basename(args.path)} doesn't exists!`,
			}
		},
		draftFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.draftFile(args)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `File ${path.basename(args.path)} doesn't exists!`,
			}
		},
		renameFile: async (_, args) => {
			if (fs.existsSync(args.oldPath)) {
				return files
					.renameFile(args.oldPath, args.newPath)
					.then(response => ({
						success: true,
						message: response,
					}))
					.catch(failure => ({
						success: false,
						error: new Error(failure),
					}))
			}
			return {
				success: false,
				error: `File ${path.basename(args.oldPath)} doesn't exists!`,
			}
		},
		imageUpload: async (_, args) => {
			const { filename } = await args.file
			return files
				.upload(args)
				.then(() => ({
					success: true,
					message: `File ${filename} has been uploaded`,
				}))
				.catch(failure => ({
					success: false,
					error: new Error(failure),
				}))
		},
	},
}

module.exports = resolvers
