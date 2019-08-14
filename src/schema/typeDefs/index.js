const { gql } = require('apollo-server-express')

const typeDefs = gql`
	type Folder {
		name: String
		path: String
		type: String
		children: [Folder]
	}
	type File {
		name: String
		path: String
		type: String
		content: String
		size: Int
		ext: String
		createdAt: String
	}
	type Query {
		getFolder(path: String): Folder
		getNestedFolders(path: String): Folder
		getFile(path: String!): File
	}
`

module.exports = typeDefs
