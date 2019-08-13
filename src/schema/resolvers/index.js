const filesystem = require('../../filesystem')
const folders = require('../../functions/folder')
const files = require('../../functions/file')

const allFiles = require('../../allFilesData.js')

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
		contentWithFilesData: async (_, args) => {
			const data = await allFiles
				.displayData(args.path)
				.then(response => response)
			const appendData = await {
				name: 'Folder',
				path: './filesystem',
				type: 'folder',
				children: data,
			}
			return appendData
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
