/* eslint-disable import/no-extraneous-dependencies */
import graphqlHTTP from 'express-graphql';
import schema from './schema';

const express = require('express');
// let database = require('./database');
const cors = require('cors');

const gitcommit = require('./git-add-and-commit');
const allFiles = require('./allFilesData');

const filesystem = require('./filesystem');
const gitCommits = require('./git-commit-log');
const gitStatus = require('./git-status');
const redis = require('./redis');

// let test = require('./test')
// let folder  = require("../filesystem")
const app = express();
const port = 3000;
// eslint-disable-next-line import/no-extraneous-dependencies
// eslint-disable-next-line import/order
// eslint-disable-next-line import/no-extraneous-dependencies
// eslint-disable-next-line import/order
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

/* GraphQL set */
app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true,
}));

app.get('/', (req, res) => {
  res.send('Mandi Api endpoint');
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
  redis.addToList(req.body.file).then((data) => {
    res.send(data);
  });
});

app.post('/getEditorFiles', (req, res) => {
  redis.getAllFiles().then((data) => {
    res.send(data);
  });
});

app.post('/removeFileFromEditor', (req, res) => {
  redis.removeFromList(req.body.file).then((data) => {
    res.send(data);
  });
});

app.listen(port, () => { console.log('App is running on port 3000'); });
