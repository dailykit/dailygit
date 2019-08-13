const { gql } = require('apollo-server-express')

const typeDefs = gql`
	union FolderOrFile = Folder | File
	type Folder {
		name: String
		path: String
		type: String
		children: [FolderOrFile]
	}
	type File {
		name: String
		path: String
		content: String
		type: String
		size: Int
		ext: String
		createdAt: String
	}
	type Query {
		folders: Folder
		getFile(path: String!): File
	}
`

module.exports = typeDefs
