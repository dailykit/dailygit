const { gql } = require('apollo-server-express')

const filesystem = require('../../filesystem')

const functions = require('../../functions/folder')

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
			// console.log(appendData)
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
			// console.log(data)
			return appendData
		},
	},
	Mutation: {
		createFolder: async (_, args) => functions.createFolder(args.path),
		deleteFolder: async (_, args) => {
			const response = await functions.deleteFolder(args.path)
			return 'Folder deleted succesfully!'
		},
	},
}

module.exports = resolvers
