const { gql } = require('apollo-server-express')

const typeDefs = gql`
	type Content {
		name: String
		path: String
		type: String
		size: Int
		children: [Content]
	}
	type Folder {
		name: String
		path: String
		type: String
		children: [Folder]
	}
	type Query {
		hello: String
		content: Content
		folders: Folder
	}
`

module.exports = typeDefs
