import { gql } from 'apollo-server-express'

const resolvers = {
	Query: {
		hello: () => 'world',
	},
}

export default resolvers
