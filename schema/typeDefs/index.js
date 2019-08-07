import { gql } from 'apollo-server-express'

const typeDefs = gql`
	type Content {
		name: String
		path: String
	}
	type Query {
		hello: String
		content: [Content]
	}
`

export default typeDefs
