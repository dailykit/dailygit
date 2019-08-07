var nodegit = require('nodegit')
var path = require('path')

// var fileName = "gitcommitlog.js";
// var directoryName = './Ingredients/';

var repo
var index
var oid

function CommitFile(filepath, gitmessage) {
	return new Promise((resolve, reject) => {
		let filepathArray = filepath.split('/')
		let directoryName = './'
		for (let i = 2; i < filepathArray.length - 1; i++) {
			directoryName += filepathArray[i] + '/'
		}

		let fileName = filepathArray[filepathArray.length - 1]

		nodegit.Repository.open('../filesystem/')
			.then(function(repoResult) {
				repo = repoResult
			})
			.then(function() {
				return repo.refreshIndex()
			})
			.then(function(indexResult) {
				// console.log(indexResult)
				index = indexResult
			})
			//.then(function() {
			// this file is in the root of the directory and doesn't need a full path
			//  return index.addByPath(fileName);
			//})
			.then(function() {
				//   // this file is in a subdirectory and can use a relative path
				return index.addByPath(path.posix.join(directoryName, fileName))
			})
			.then(function() {
				// this will write both files to the index
				return index.write()
			})
			.then(function() {
				return index.writeTree()
			})
			.then(function(oidResult) {
				oid = oidResult
				return nodegit.Reference.nameToId(repo, 'HEAD')
			})
			.then(function(head) {
				return repo.getCommit(head)
			})
			.then(function(parent) {
				var author = nodegit.Signature.now(
					'Suresh',
					'suresh@dailykit.org'
				)
				var committer = nodegit.Signature.now(
					'Suresh',
					'suresh@dailykit.org'
				)
				let commitObject = {
					message: gitmessage,
					filepath: filepath,
				}
				//JSON.stringify(commitObject);
				let stringMessage = JSON.stringify(commitObject)
				console.log(stringMessage)
				console.log(typeof stringMessage)
				return repo.createCommit(
					'HEAD',
					author,
					committer,
					stringMessage,
					oid,
					[parent]
				)
			})
			.done(function(commitId) {
				//  console.log("New Commit: ", commitId);
				resolve({ CommitId: commitId })
			})
	})
}

module.exports = {
	CommitFile: CommitFile,
}
