const path = require('path')
const _ = require('lodash')
const fs = require('fs')

const folders = require('../../functions/folder')
const files = require('../../functions/file')
const getFolderSize = require('../../utils/getFolderSize')

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
		getNestedFoldersWithFiles: async (_, args) => {
			if (fs.existsSync(args.path)) {
				const data = await folders
					.getNestedFoldersWithFiles(args.path)
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
		getFile: async (_, args) =>
			await files
				.getFile(args.path)
				.then(success => success)
				.catch(failure => console.log(failure.message)),
	},
	Mutation: {
		createFolder: async (_, args) => folders.createFolder(args.path),
		deleteFolder: async (_, args) => {
			const response = await folders.deleteFolder(args.path)
			return 'Folder deleted succesfully!'
		},
		createFile: async (_, args) =>
			files
				.createFile(args.path, args.type)
				.then(success => success)
				.catch(failure => failure),
		deleteFile: async (_, args) =>
			files
				.deleteFile(args.path)
				.then(success => success)
				.catch(failure => failure),
		updateFile: async (_, args) =>
			files
				.updateFile(args.path, args.data)
				.then(sucess => sucess)
				.catch(failure => "File doesn't exists!"),
	},
}

module.exports = resolvers
