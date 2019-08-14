const path = require('path')

const folders = require('../../functions/folder')
const files = require('../../functions/file')

const resolvers = {
	Query: {
		getNestedFolders: async (_, args) => {
			const data = await folders
				.getNestedFolders(args.path)
				.then(response => response)
			const withParent = {
				name: path.parse(args.path).name,
				type: 'folder',
				path: args.path,
				children: data,
			}
			return withParent
		},
		getFolder: async (_, args) =>
			await folders.getFolder(args.path).then(response => response),
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
