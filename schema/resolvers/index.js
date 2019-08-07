import { gql } from 'apollo-server-express'

import filesystem from '../../filesystem'

const resolvers = {
	Query: {
		hello: () => 'world',
		content: () =>
			filesystem.displayData('./filesystem').then(response => response),
	},
}

export default resolvers
