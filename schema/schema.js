const { makeExecutableSchema } = require('graphql-tools')

// Import Schema Types
const typeDefs = require('./typeDefs/index')
//Import Schema Resolvers
const resolvers = require('./resolvers/index')

const schema = makeExecutableSchema({
	typeDefs,
	resolvers,
})

module.exports = schema
