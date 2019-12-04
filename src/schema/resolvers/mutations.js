const path = require('path')
const fs = require('fs')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const dailygit = require('../../functions')

const {
	addDataFolders,
	addExtendedSchemaFiles,
	addSchemaFolders,
} = require('../../utils/installApp')

const { repoDir, getRelFilePath } = require('../../utils/parsePath')

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

			const appPath = `./../apps/${args.name}`
			const dataFolders = []
			const schemaFolders = []
			const { schemas } = args.schemas ? JSON.parse(args.schemas) : {}
			const { apps } = args.apps ? JSON.parse(args.apps) : {}

			if (args.type === 'hybrid' || args.type === 'independent') {
				// Add Schema, Data Folder Paths
				await schemas.map(folder => {
					schemaFolders.push(`${appPath}/schema/${folder.path}`)
					dataFolders.push(`${appPath}/data/${folder.path}`)
				})
			}

			// Hybrid App
			if (args.type === 'hybrid') {
				try {
					// Update the deps of extended app.
					await dailygit.database.updateApp(apps, docId)

					// Create data folders and initialize git
					await addDataFolders(dataFolders)

					// Create Folders with Schema Entity Files
					await addSchemaFolders(schemaFolders, schemas, appPath)

					// Create Extendend Schema File
					await addExtendedSchemaFiles(apps, args.name)

					return {
						success: true,
						message: `App ${args.name} is installed!`,
					}
				} catch (error) {
					return {
						success: false,
						error: `App ${args.name} did not install correctly!`,
					}
				}
			}
			// Independent App
			if (args.type === 'independent') {
				try {
					// Create data folders and initialize git
					await addDataFolders(dataFolders)

					// Create Folders with Schema Entity Files
					await addSchemaFolders(schemaFolders, schemas, appPath)

					return {
						success: true,
						message: `App ${args.name} is installed!`,
					}
				} catch (error) {
					return {
						success: false,
						error: `App ${args.name} did not install correctly!`,
					}
				}
			}
			// Dependent App
			if (args.type === 'dependent') {
				try {
					// Update the deps of extended app.
					await dailygit.database.updateApp(apps, docId)

					// Create Extendend Schema File
					await addExtendedSchemaFiles(apps, args.name)

					return {
						success: true,
						message: `App ${args.name} is installed!`,
					}
				} catch (error) {
					return {
						success: false,
						error: `App ${args.name} did not install correctly!`,
					}
				}
			}
		},
		createFolder: async (_, args) => {
			try {
				await dailygit.folders.createFolder(args.path)
				return {
					success: true,
					message: `Folder: ${path.basename(
						args.path
					)} has been created!`,
				}
			} catch (error) {
				return {
					success: false,
					error,
				}
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
				await dailygit.files.createFile(args.path, args.content)

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
					committer,
					`Added: ${path.basename(args.path)}`
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
					error,
				}
			}
		},
		updateFile: async (_, args) => {
			try {
				// File System
				await dailygit.files.updateFile(args.path, args.content)

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
					committer,
					args.message
				)

				// Database
				await dailygit.database.updateFile({
					commit: sha,
					path: args.path,
				})

				return {
					success: true,
					message: `File: ${path.basename(
						args.path
					)} has been updated!`,
				}
			} catch (error) {
				return {
					success: false,
					error,
				}
			}
		},
		draftFile: async (_, args) => {
			try {
				// File System
				await dailygit.files.updateFile(args.path, args.content)

				// Database
				await dailygit.database.updateFile({
					path: args.path,
					lastSaved: Date.now(),
				})
				return {
					success: true,
					message: `File: ${path.basename(
						args.path
					)} has been updated!`,
				}
			} catch (error) {
				return {
					success: false,
					error,
				}
			}
		},
		renameFile: async (_, args) => {
			try {
				// File System
				await dailygit.files.renameFile(args.oldPath, args.newPath)

				// Git
				const author = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}
				const committer = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}

				await git.remove({
					dir: repoDir(args.oldPath),
					filepath: getRelFilePath(args.oldPath),
				})

				const sha = await dailygit.git.addAndCommit(
					args.newPath,
					author,
					committer,
					`Renamed: ${path.basename(
						args.oldPath
					)} file to ${path.basename(args.newPath)}`
				)

				// Database
				await dailygit.database.updateFile({
					commit: sha,
					path: args.oldPath,
					newPath: args.newPath,
				})

				return {
					success: true,
					message: `File: ${path.basename(
						args.oldPath
					)} renamed to ${path.basename(args.newPath)}`,
				}
			} catch (error) {
				return {
					success: false,
					error,
				}
			}
		},
		imageUpload: async (_, args) => {
			try {
				const { files } = await args
				const author = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}
				const committer = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}

				await Object.keys(files).map(async key => {
					// File System
					const file = await files[key]
					await dailygit.files.upload(args.path, file)

					// Git
					const sha = await dailygit.git.addAndCommit(
						args.path,
						author,
						committer,
						`Uploaded: ${files.length} file${
							files.length > 1 ? 's' : ''
						}`
					)

					// Database
					const { filename } = await file
					await dailygit.database.createFile({
						name: filename,
						path: `${args.path}/${filename}`,
						commits: [sha],
					})
				})
				return {
					success: true,
					message: `${files.length} file${
						files.length > 1 ? 's' : ''
					} has been uploaded`,
				}
			} catch (error) {
				return {
					success: false,
					error,
				}
			}
		},
	},
}

module.exports = resolvers
