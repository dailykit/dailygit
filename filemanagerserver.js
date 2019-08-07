/* eslint-disable import/no-extraneous-dependencies */
import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import cors from 'cors'
import http from 'http'
import bodyParser from 'body-parser'

// Import Schema
import { schema } from './schema/schema'

// Import functions
import gitcommit from './git-modification-code/git-add-and-commit'
import allFiles from './allFilesData'

import filesystem from './filesystem'
import gitCommits from './git-modification-code/git-commit-log'
import gitStatus from './git-modification-code/git-status'
import editorFiles from './editorfiles.js'

const PORT = 3000

const apolloserver = new ApolloServer({
	schema,
	playground: {
		endpoint: `http://localhost:${PORT}/graphql`,
		settings: {
			'editor.theme': 'dark',
		},
	},
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

app.get('/getFile', (req, res) => {
	filesystem.getFile(req.query.file).then(response => {
		res.setHeader('Access-Control-Allow-Origin', '*')
		res.setHeader('Access-Control-Allow-Headers', '*')
		const returndata = {
			response,
		}
		res.send(returndata)
	})
})
app.post('/commitFile', (req, res) => {
	const { filePath } = req.body
	const { commitMessage } = req.body
	gitcommit.CommitFile(filePath, commitMessage).then(response => {
		res.send(response)
	})
})
app.get('/getCommitLog', (req, res) => {
	gitCommits.getCommitLog().then(response => {
		res.send(response)
	})
})

app.get('/getGitStatus', (req, res) => {
	gitStatus.gitStatus().then(response => {
		res.send(response)
	})
})

app.get('/loadfiles', (req, res) => {
	filesystem.displayData('./filesystem').then(response => {
		res.send(response)
	})
})

app.get('/allFilesWithData', (req, res) => {
	allFiles.displayData('./filesystem').then(response => {
		res.send(response)
	})
})

app.post('/getFile', (req, res) => {
	filesystem.getFile(req.body.file).then(response => {
		res.setHeader('Access-Control-Allow-Origin', '*')
		res.setHeader('Access-Control-Allow-Headers', '*')
		//      let data = JSON.stringify(response);
		// res.send(data);
		//      res.send({'status': 'success'});
		const returndata = {
			response,
		}
		res.send(returndata)
	})
})

app.post('/updateFile', (req, res) => {
	filesystem.updateFile(req.body).then(response => {
		res.setHeader('Access-Control-Allow-Origin', '*')
		res.setHeader('Access-Control-Allow-Headers', '*')

		res.send(response)
	})
})

app.post('/createNewFile', (req, res) => {
	filesystem.createNewFile(req.body).then(response => {
		res.setHeader('Access-Control-Allow-Origin', '*')
		res.setHeader('Access-Control-Allow-Headers', '*')
		res.send(response)
	})
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

app.get('/allRecipes', (req, res) => {
	allFiles.displayData('./filesystem/Recipes').then(data => {
		res.send(data)
	})
})

server.listen(PORT, () =>
	console.log(
		'🚀 Server ready at',
		`http://localhost:${PORT}${apolloserver.graphqlPath}`
	)
)
