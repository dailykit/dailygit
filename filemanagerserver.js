var express = require('express')
// let database = require('./database');
var cors = require('cors')

let gitcommit = require('./git-add-and-commit');
let allFiles = require('./allFilesData');

let filesystem = require('./filesystem');
let gitCommits = require('./git-commit-log');
let gitStatus = require('./git-status');
// let test = require('./test')
// let folder  = require("../filesystem")
const app = express();
const port = 3000;
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cors({'origin': '*'}))


app.get('/', (req, res) => {
        res.send("Mandi Api endpoint")
})

app.get('/getFile', (req, res)=> {
	    filesystem.getFile(req.query.file).then(response => {
	     res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
//      let data = JSON.stringify(response);
        //res.send(data);
//      res.send({'status': 'success'});
let returndata = {
    response
}
        res.send(returndata);
    })

})
app.post('/commitFile',(req, res) => {
	let filePath = req.body.filePath;
	let commitMessage = req.body.commitMessage;
	gitcommit.CommitFile(filePath, commitMessage).then(response => {
		res.send(response);
	})
})
app.get('/getCommitLog', (req,res) => {
        gitCommits.getCommitLog().then(response => {
                res.send(response);
        })
})

app.get('/getGitStatus', (req, res) => {
	gitStatus.gitStatus().then(response => {
		res.send(response);
	})
})


app.get('/loadfiles',(req, res) => {
    filesystem.displayData('./filesystem').then(response => {
        res.send(response);
    });

})

app.get('/allFilesWithData', (req,res) => {
	allFiles.displayData('./filesystem')
	.then(response => {
        	res.send(response);
	})

})

app.post('/getFile', function(req, res) {
    filesystem.getFile(req.body.file).then(response => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
//      let data = JSON.stringify(response);
        //res.send(data);
//      res.send({'status': 'success'});
let returndata = {
    response
}
        res.send(returndata);
    })
})

app.post('/updateFile', (req, res) => {
    filesystem.updateFile(req.body).then(response =>{
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');

        res.send(response);
    })
})

app.post('/createNewFile', (req, res) => {
    filesystem.createNewFile(req.body).then(response => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.send(response);
    })
})
app.listen(port, () => { console.log("App is running on port 3000") })
