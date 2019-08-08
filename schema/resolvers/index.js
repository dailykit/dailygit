import { gql } from 'apollo-server-express'

import filesystem from '../../filesystem'

const resolvers = {
	Query: {
		hello: () => 'world',
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
}

export default resolvers
