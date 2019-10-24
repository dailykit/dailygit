const { gql } = require('apollo-server-express')

const mutations = gql`
	type Mutation {
		createFolder(path: String): Result
		deleteFolder(path: String): Result
		renameFolder(oldPath: String!, newPath: String!): Result
		createFile(path: String, content: String): Result
		deleteFile(path: String): Result
		updateFile(
			path: String!
			data: String!
			commitMessage: String!
			validatedFor: [String]!
		): Result
		draftFile(path: String!, data: String!): Result
		renameFile(oldPath: String!, newPath: String!): Result
		installApp(name: String!, schemas: String): Result
		extendApp(name: String!, apps: String): Result
	}
`

module.exports = mutations
