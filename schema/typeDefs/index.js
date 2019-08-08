import { gql } from 'apollo-server-express'

const typeDefs = gql`
	type Content {
		name: String
		path: String
		type: String
		children: [Content]
	}
	type Folder {
		name: String
		path: String
		type: String
		children: [Folder]
	}
	type Query {
		hello: String
		content: Content
		folders: Folder
	}
`

export default typeDefs
