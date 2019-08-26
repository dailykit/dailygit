const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const cors = require('cors')
const http = require('http')
const bodyParser = require('body-parser')
const depthLimit = require('graphql-depth-limit')

// Import Schema
const schema = require('./schema/schema')

// Import functions
const editorFiles = require('./editorfiles.js')

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
const io = require('socket.io')(http)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors({ origin: '*' }))

app.get('/', (req, res) => {
	res.send('Welcome to File Manager Server API')
})

app.post('/addFileToEditor', (req, res) => {
	editorFiles.addToList(req.body.file).then(data => {
		// res.send(data);
		res.send({ status: 'File is added' })
	})

	// io.on('connect', (socket) => {
	// console.log('Connected!');
	// const socket = io.connect('http://localhost:3000');
	io.emit('OpenedFiles', 'Server', req.body.file)
	// });
})

app.get('/getEditorFiles', (req, res) => {
	editorFiles.getAllFiles().then(data => {
		res.send(data)
	})
})

app.post('/removeFileFromEditor', (req, res) => {
	editorFiles.removeFromList(req.body.file).then(data => {
		res.send(data)
	})
})

server.listen(PORT, () =>
	console.log(
		'🚀 Server ready at',
		`http://localhost:${PORT}${apolloserver.graphqlPath}`
	)
)
