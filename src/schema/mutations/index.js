const { gql } = require('apollo-server-express')

const mutations = gql`
	type Mutation {
		createFolder(path: String): String
		deleteFolder(path: String): String
	}
`

module.exports = mutations
