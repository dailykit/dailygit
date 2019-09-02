const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const cors = require('cors')
const http = require('http')
const bodyParser = require('body-parser')
const depthLimit = require('graphql-depth-limit')

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
		settings: {
			'editor.theme': 'dark',
		},
	},
	introspection: process.env.NODE_ENV === 'production' ? false : true,
	validationRules: [depthLimit(5)],
	formatError: err => {
		if (err.message.includes('ENOENT'))
			return new Error('No such folder or file exists!')
		return new Error(err)
	},
	debug: false,
})

const app = express()

apolloserver.applyMiddleware({ app })
const server = http.createServer(app)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors({ origin: '*' }))

app.get('/', (req, res) => {
	res.send('Welcome to File Manager Server API')
})

server.listen(PORT, () =>
	console.log(
		'🚀 Server ready at',
		`http://localhost:${PORT}${apolloserver.graphqlPath}`
	)
)