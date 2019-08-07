import { makeExecutableSchema } from 'graphql-tools'

// Import Schema Types
import typeDefs from './typeDefs/index'
//Import Schema Resolvers
import resolvers from './resolvers/index'

export const schema = makeExecutableSchema({
	typeDefs,
	resolvers,
})
