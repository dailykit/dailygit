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

const { repoDir, getRelFilePath, getAppName } = require('../../utils/parsePath')

const getFilePaths = require('../../utils/getFilePaths')

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
				...(args.staging && { staging: true }),
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
		deleteFolder: async (_, args) => {
			const files = await getFilePaths(args.path)

			try {
				// File System
				await dailygit.folders.deleteFolder(args.path)

				const author = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}
				const committer = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}

				await files.map(async filePath => {
					// Git
					await dailygit.git.removeAndCommit(
						filePath,
						author,
						committer,
						`Deleted: File ${path.basename(filePath)}`
					)

					// Database
					await dailygit.database.deleteFile(
						filePath,
						getAppName(filePath)
					)
				})

				await files.map(async filePath => {
					const { dependents } = await dailygit.database.readApp(
						getAppName(filePath)
					)

					await dependents.map(async dependent => {
						try {
							const exists = await dailygit.database.fileExists(
								{
									path: filePath,
								},
								dependent.name
							)
							if (exists) {
								return await dailygit.database.deleteFile(
									filePath,
									dependent.name
								)
							}
							return
						} catch (error) {
							throw error
						}
					})
				})

				return {
					success: true,
					message: `Folder: ${path.basename(
						args.path
					)} has been deleted!`,
				}
			} catch (error) {
				return {
					success: false,
					error,
				}
			}
		},
		renameFolder: async (_, args) => {
			try {
				const oldFiles = await getFilePaths(args.oldPath)

				// File System
				await dailygit.folders.renameFolder(args.oldPath, args.newPath)

				// Git
				const newFiles = await getFilePaths(args.newPath)
				const author = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}
				const committer = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}

				await oldFiles.map(filePath => {
					return git.remove({
						dir: repoDir(args.oldPath),
						filepath: getRelFilePath(filePath),
					})
				})

				await newFiles.map(async filePath => {
					try {
						const sha = await dailygit.git.addAndCommit(
							filePath,
							author,
							committer,
							`Moved: ${path.basename(
								filePath
							)} from ${path.basename(
								args.oldPath
							)} to ${path.basename(args.newPath)}`
						)

						// Database
						await dailygit.database.updateFile(
							{
								commit: sha,
								path: oldFiles[newFiles.indexOf(filePath)],
								newPath: filePath,
							},
							getAppName(filePath)
						)

						const { dependents } = await dailygit.database.readApp(
							getAppName(args.oldPath)
						)

						await dependents.map(async dependent => {
							try {
								const file = await dailygit.database.fileExists(
									{
										path:
											oldFiles[
												newFiles.indexOf(filePath)
											],
									},
									dependent.name
								)
								if (file) {
									return await dailygit.database.updateFile(
										{
											commit: sha,
											path:
												oldFiles[
													newFiles.indexOf(filePath)
												],
											newPath: filePath,
										},
										dependent.name
									)
								}
								return
							} catch (error) {
								throw error
							}
						})
					} catch (error) {
						throw error
					}
				})

				return {
					success: true,
					message: `Folder ${path.basename(
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
				await dailygit.database.createFile(
					{
						name: path.basename(args.path),
						path: args.path,
						commits: [sha],
					},
					getAppName(args.path)
				)

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
				await dailygit.database.deleteFile(
					args.path,
					getAppName(args.path)
				)

				const { dependents } = await dailygit.database.readApp(
					getAppName(args.path)
				)

				await dependents.map(async dependent => {
					try {
						const file = await dailygit.database.fileExists(
							{
								path: args.path,
							},
							dependent.name
						)
						if (file) {
							return await dailygit.database.deleteFile(
								args.path,
								dependent.name
							)
						}
						return
					} catch (error) {
						throw error
					}
				})

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
				await dailygit.database.updateFile(
					{
						commit: sha,
						path: args.path,
					},
					getAppName(args.path)
				)

				// Update dependents if any
				const { dependents } = await dailygit.database.readApp(
					getAppName(args.path)
				)
				await dependents.map(async dependent => {
					try {
						const exists = await dailygit.database.fileExists(
							{
								path: args.path,
							},
							dependent.name
						)

						if (exists) {
							return await dailygit.database.updateFile(
								{
									commit: sha,
									path: args.path,
									...(dependent.staging && {
										content: args.content,
									}),
								},
								dependent.name
							)
						} else {
							const mainFile = await dailygit.database.readFile(
								{
									path: args.path,
								},
								getAppName(args.path)
							)
							return await dailygit.database.createFile(
								{
									name: mainFile.name,
									path: mainFile.path,
									commits: mainFile.commits,
									...(dependent.staging && {
										content: args.content,
									}),
								},
								dependent.name
							)
						}
					} catch (error) {
						throw error
					}
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
				await dailygit.database.updateFile(
					{
						commit: sha,
						path: args.oldPath,
						newPath: args.newPath,
					},
					getAppName(args.oldPath)
				)

				const { dependents } = await dailygit.database.readApp(
					getAppName(args.oldPath)
				)

				await dependents.map(async dependent => {
					try {
						const file = await dailygit.database.fileExists(
							{
								path: args.oldPath,
							},
							dependent.name
						)
						if (file) {
							return await dailygit.database.updateFile(
								{
									commit: sha,
									path: args.oldPath,
									newPath: args.newPath,
								},
								dependent.name
							)
						}
						return
					} catch (error) {
						throw error
					}
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
					await dailygit.database.createFile(
						{
							name: filename,
							path: `${args.path}/${filename}`,
							commits: [sha],
						},
						getAppName(args.path)
					)
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
