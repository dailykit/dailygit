const path = require('path')
const fs = require('fs')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const dailygit = require('../../functions')

const resolvers = {
	Mutation: {
		installApp: async (_, args) => {
			// Add the app to installed list in DB
			const options = {
				name: args.name,
				...(args.schemas && {
					entities: JSON.parse(args.schemas).schemas.map(
						schema => schema.path
					),
				}),
			}

			const docId = await dailygit.database
				.createApp(options)
				.then(result => result.id)

			// Hybrid App
			if (args.type === 'hybrid') {
				const appPath = `./../apps/${args.name}`
				const dataFolders = []
				const schemaFolders = []
				const { schemas } = JSON.parse(args.schemas)
				const { apps } = JSON.parse(args.apps)

				// Update the deps of extended app.
				await dailygit.database.updateApp(apps, docId)

				// Add Schema, Data Folder Paths
				const addPaths = await schemas.map(folder => {
					schemaFolders.push(`${appPath}/schema/${folder.path}`)
					dataFolders.push(`${appPath}/data/${folder.path}`)
				})

				// Create data folders and initialize git
				const addDatas = await dataFolders.map(path =>
					dailygit.folders
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
					dailygit.folders
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
					dailygit.folders
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
					dailygit.folders
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
				await dailygit.database.updateApp(apps, docId)

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

				return Promise.all([addSchemas])
					.then(() => ({
						success: true,
						message: `App ${args.name} is installed!`,
					}))
					.catch(error => console.log(error))
			}
		},
		createFolder: (_, args) => {
			if (fs.existsSync(args.path)) {
				return {
					success: false,
					error: `Folder ${path.basename(args.path)} already exists!`,
				}
			} else {
				return dailygit.folders
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
				return dailygit.folders
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
				return dailygit.folders
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
		createFile: async (_, args) => {
			try {
				// Filesystem
				await dailygit.files.createFile(args)

				// Git
				const author = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}
				const committer = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}
				const sha = await dailygit.git.addAndCommit(
					args.path,
					author,
					committer
				)

				// Database
				await dailygit.database.createFile({
					name: path.basename(args.path),
					path: args.path,
					commits: [sha],
				})

				return {
					success: true,
					message: `File ${path.basename(
						args.path
					)} has been created`,
				}
			} catch (error) {
				return {
					success: false,
					error,
				}
			}
		},
		deleteFile: async (_, args) => {
			try {
				// Filesystem
				await dailygit.files.deleteFile(args.path)

				// Git
				const author = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}
				const committer = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}
				await dailygit.git.removeAndCommit(args.path, author, committer)

				// Database
				await dailygit.database.deleteFile(args.path)

				return {
					success: true,
					message: `File ${path.basename(
						args.path
					)} has been deleted`,
				}
			} catch (error) {
				return {
					success: false,
					error: new Error(error),
				}
			}
		},
		updateFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return dailygit.files
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
				return dailygit.files
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
				return dailygit.files
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
			const allFiles = await args.files
			return dailygit.files
				.upload(args)
				.then(() => ({
					success: true,
					message: `${allFiles.length} file${
						allFiles.length > 1 ? 's' : ''
					} has been uploaded`,
				}))
				.catch(failure => ({
					success: false,
					error: new Error(failure),
				}))
		},
	},
}

module.exports = resolvers
