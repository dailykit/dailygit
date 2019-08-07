/* eslint-disable import/no-extraneous-dependencies */
import graphqlHTTP from 'express-graphql';
import { emitKeypressEvents } from 'readline';
import schema from './schema';

const express = require('express');
// let database = require('./database');
const cors = require('cors');

const gitcommit = require('./git-modification-code/git-add-and-commit');
const allFiles = require('./allFilesData');

const filesystem = require('./filesystem');
const gitCommits = require('./git-modification-code/git-commit-log');
const gitStatus = require('./git-modification-code/git-status');
const editorFiles = require('./editorfiles.js');

// let test = require('./test')
// let folder  = require("../filesystem")
const app = express();
const port = 3000;

const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

/* GraphQL set */
app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true,
}));

app.get('/', (req, res) => {
  res.send('Welcome to File Manager Server API');
});

app.get('/getFile', (req, res) => {
  filesystem.getFile(req.query.file).then((response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    const returndata = {
      response,
    };
    res.send(returndata);
  });
});
app.post('/commitFile', (req, res) => {
  const { filePath } = req.body;
  const { commitMessage } = req.body;
  gitcommit.CommitFile(filePath, commitMessage).then((response) => {
    res.send(response);
  });
});
app.get('/getCommitLog', (req, res) => {
  gitCommits.getCommitLog().then((response) => {
    res.send(response);
  });
});

app.get('/getGitStatus', (req, res) => {
  gitStatus.gitStatus().then((response) => {
    res.send(response);
  });
});


app.get('/loadfiles', (req, res) => {
  filesystem.displayData('./filesystem').then((response) => {
    res.send(response);
  });
});

app.get('/allFilesWithData', (req, res) => {
  allFiles.displayData('./filesystem')
    .then((response) => {
      res.send(response);
    });
});

app.post('/getFile', (req, res) => {
  filesystem.getFile(req.body.file).then((response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    //      let data = JSON.stringify(response);
    // res.send(data);
    //      res.send({'status': 'success'});
    const returndata = {
      response,
    };
    res.send(returndata);
  });
});

app.post('/updateFile', (req, res) => {
  filesystem.updateFile(req.body).then((response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    res.send(response);
  });
});

app.post('/createNewFile', (req, res) => {
  filesystem.createNewFile(req.body).then((response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.send(response);
  });
});

app.post('/addFileToEditor', (req, res) => {
  editorFiles.addToList(req.body.file).then((data) => {
    // res.send(data);
    res.send({ status: 'File is added' });
  });

  // io.on('connect', (socket) => {
  // console.log('Connected!');
  // const socket = io.connect('http://localhost:3000');
  io.emit('OpenedFiles', 'Server', req.body.file);
  // });
});

app.get('/getEditorFiles', (req, res) => {
  editorFiles.getAllFiles().then((data) => {
    res.send(data);
  });
});

app.post('/removeFileFromEditor', (req, res) => {
  editorFiles.removeFromList(req.body.file).then((data) => {
    res.send(data);
  });
});

app.get('/allRecipes', (req, res) => {
  allFiles.displayData('./filesystem/Recipes').then((data) => {
    res.send(data);
  })
})

// app.listen(port, () => { console.log('App is running on port 3000'); });


http.listen(port, () => {
  console.log('listening on *:3000');
});
