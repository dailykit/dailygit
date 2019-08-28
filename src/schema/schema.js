const { makeExecutableSchema } = require('graphql-tools')

// Import Schema Types
const types = require('./typeDefs/index')

// Import Schema Types
const mutations = require('./mutations/index')

// Import Schema Resolvers
const resolvers = require('./resolvers/index')

const schema = makeExecutableSchema({
	typeDefs: [types, mutations],
	resolvers,
})

module.exports = schema
