const { gql } = require('apollo-server-express')

const mutations = gql`
	"List of all mutations"
	type Mutation {
		"Mutation to create a folder"
		createFolder(path: String): String
		"Mutation to delete a folder"
		deleteFolder(path: String): String
	}
`

module.exports = mutations
