const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const cors = require('cors')
const depthLimit = require('graphql-depth-limit')
const http = require('http')

// Import Schema
const schema = require('./schema/schema')

const PORT = 4000
const apolloserver = new ApolloServer({
	schema,
	playground: {
		endpoint: `${
			process.env.NODE_ENV === 'production'
				? process.env.INST_URI
				: 'http://localhost:'
		}${PORT}/graphql`,
	},
	introspection: process.env.NODE_ENV === 'production' ? false : true,
	validationRules: [depthLimit(11)],
	formatError: err => {
		if (err.message.includes('ENOENT'))
			return new Error('No such folder or file exists!')
		return new Error(err)
	},
	debug: false,
})

const app = express()

apolloserver.applyMiddleware({ app })

const httpServer = http.createServer(app)
apolloserver.installSubscriptionHandlers(httpServer)

app.use(cors({ origin: '*' }))

httpServer.listen(PORT, () => {
	console.log(
		'🚀 Server ready at',
		`http://localhost:${PORT}${apolloserver.graphqlPath}`
	)
	console.log(
		'🚀 Subscriptions ready at',
		`ws://localhost:${PORT}${apolloserver.subscriptionsPath}`
	)
})
