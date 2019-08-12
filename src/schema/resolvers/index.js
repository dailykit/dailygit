const filesystem = require('../../filesystem')
const folders = require('../../functions/folder')
const files = require('../../functions/file')

const resolvers = {
	Query: {
		content: async () => {
			const data = await filesystem
				.displayData('./filesystem')
				.then(response => response)
			const appendData = await {
				name: 'Folder',
				path: './filesystem',
				type: 'folder',
				children: data,
			}
			return appendData
		},
		folders: async () => {
			const data = await filesystem
				.displayFolders('./filesystem')
				.then(response => response)
			const appendData = await {
				name: 'Folder',
				path: './filesystem',
				type: 'folder',
				children: data,
			}
			return appendData
		},
	},
	Mutation: {
		createFolder: async (_, args) => folders.createFolder(args.path),
		deleteFolder: async (_, args) => {
			const response = await folders.deleteFolder(args.path)
			console.log('TCL: response', response)
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
	},
}

module.exports = resolvers
