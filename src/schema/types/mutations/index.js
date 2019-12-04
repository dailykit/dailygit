const { gql } = require('apollo-server-express')

const mutations = gql`
	type Mutation {
		createFolder(path: String): Result
		deleteFolder(path: String): Result
		renameFolder(oldPath: String!, newPath: String!): Result
		createFile(path: String, content: String): Result
		deleteFile(path: String): Result
		updateFile(path: String!, content: String!, message: String!): Result
		draftFile(path: String!, data: String!): Result
		renameFile(oldPath: String!, newPath: String!): Result
		installApp(
			name: String!
			schemas: String
			apps: String
			type: String!
		): Result
		imageUpload(files: [Upload!]!, path: String!): Result
	}
`

module.exports = mutations
