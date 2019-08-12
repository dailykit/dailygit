const { gql } = require('apollo-server-express')

const mutations = gql`
	"List of all mutations"
	type Mutation {
		"Mutation to create a folder"
		createFolder(path: String): String
		"Mutation to delete a folder"
		deleteFolder(path: String): String
		"Mutation to create a file"
		createFile(path: String, type: String): String
	}
`

module.exports = mutations
