const path = require('path')
const _ = require('lodash')
const fs = require('fs')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const folders = require('../../functions/folder')
const files = require('../../functions/file')

const getFolderSize = require('../../utils/getFolderSize')

const baseFolder = './../apps'

const resolvers = {
	FolderOrFile: {
		__resolveType: obj => {
			if (obj.children) return 'Folder'
			if (obj.content) return 'File'
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
				.searchFiles(args.path)
				.then(data => data)
				.catch(e => e),
		getCommitLog: async () => {
			const log = await git.log({
				dir: baseFolder,
				depth: 10,
				ref: 'master',
			})
			return log
		},
		getCommit: async (_, { id }) => {
			let { object: commit } = await git.readObject({
				dir: baseFolder,
				oid: id,
			})
			return commit
		},
	},
	Mutation: {
		installApp: async (_, args) => {
			const appPath = `./../apps/${args.name}`
			const paths = [appPath, `${appPath}/data`, `${appPath}/schema`]
			const { schemas } = JSON.parse(args.schemas)

			// Add Schema, Data Folder Paths
			await schemas.map(folder => {
				paths.push(`${appPath}/schema/${folder.path}`)
				paths.push(`${appPath}/data/${folder.path}`)
			})

			// Create Folders with Schema Entity Files
			await paths.map(path =>
				folders.createFolder(path).then(() =>
					schemas.map(folder =>
						folder.entities.map(file => {
							const folderPath = folderName =>
								`${appPath}/${folderName}/${folder.path}`
							git.init({ dir: folderPath('data') })
							const filepath = `${folderPath('schema')}/${
								file.name
							}.json`
							if (fs.existsSync(folderPath)) {
								return fs.writeFile(
									filepath,
									JSON.stringify(file.content, null, 2),
									err => {
										if (err) return new Error(err)
									}
								)
							}
						})
					)
				)
			)
			return 'App installed!'
		},
		createFolder: (_, args) => {
			if (fs.existsSync(args.path)) {
				return 'Folder already exists!'
			} else {
				return folders.createFolder(args.path)
			}
		},
		deleteFolder: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return await files
					.getAllFilesWithInFolder(args.path)
					.then(files => {
						folders.deleteFolder(args.path)
						return 'Folder deleted successfully!'
					})
			}
			return new Error('ENOENT')
		},
		renameFolder: async (_, args) => {
			if (fs.existsSync(args.oldPath)) {
				return await files
					.getAllFilesWithInFolder(args.oldPath)
					.then(files => {
						return folders
							.renameFolder(args.oldPath, args.newPath)
							.then(sucess => sucess)
							.catch(failure => failure)
					})
			}
			return new Error('ENOENT')
		},
		createFile: (_, args) => {
			if (fs.existsSync(args.path)) {
				return 'File already exists!'
			}
			fs.writeFile(
				args.path,
				JSON.stringify(args.content, null, 2),
				err => {
					if (err) return new Error(err)
					git.add({
						dir: path.parse(args.path).dir,
						filepath: path.basename(args.path),
					})
					// TODO: Add the logged in user's credentials
					git.commit({
						dir: path.parse(args.path).dir,
						author: {
							name: 'Placeholder',
							email: 'placeholder@example.com',
						},
						message: `Added: ${path.basename(args.path)}`,
					})
					return `Added: ${path.basename(args.path)}`
				}
			)
		},
		deleteFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return await files
					.deleteFile(args.path)
					.then(response => response)
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
		updateFile: async (_, args) => {
			if (fs.existsSync(args.path)) {
				return files
					.updateFile(args.path, args.data)
					.then(response => {
						return response
					})
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
		renameFile: async (_, args) => {
			if (fs.existsSync(args.oldPath)) {
				return files
					.renameFile(args.oldPath, args.newPath)
					.then(response => {
						return response
					})
					.catch(failure => failure)
			}
			return new Error('ENOENT')
		},
	},
}

module.exports = resolvers
