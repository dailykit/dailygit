const { gql } = require('apollo-server-express')

const mutations = gql`
	"List of all mutations"
	type Mutation {
		"Mutation to create a folder"
		createFolder(path: String): String
		"Mutation to delete a folder"
		deleteFolder(path: String): String
		"Mutation to rename a folder"
		renameFolder(oldPath: String!, newPath: String!): String
		"Mutation to create a file"
		createFile(path: String, type: String): String
		"Mutation to delete a file"
		deleteFile(path: String): String
		"Mutation to update the file"
		updateFile(path: String!, data: String!, commitMessage: String!): String
		"Mutation to rename a file"
		renameFile(oldPath: String!, newPath: String!): String
	}
`

module.exports = mutations
