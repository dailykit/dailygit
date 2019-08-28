var nodegit = require('nodegit')
var path = require('path')

const addAndCommit = (filepath, gitmessage) => {
	return new Promise((resolve, reject) => {
		let filepathArray = filepath.split('/')
		let directoryName = './'
		for (let i = 2; i < filepathArray.length - 1; i++) {
			directoryName += filepathArray[i] + '/'
		}

		let fileName = filepathArray[filepathArray.length - 1]
		var repo
		var index
		var oid
		nodegit.Repository.open('./filesystem/')
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

const commitLog = () => {
	return new Promise((resolve, reject) => {
		nodegit.Repository.open('./filesystem')
			.then(function(repo) {
				/* Get the current branch. */
				return repo
					.getCurrentBranch()
					.then(function(ref) {
						/* Get the commit that the branch points at. */
						return repo.getBranchCommit(ref.shorthand())
					})
					.then(function(commit) {
						/* Set up the event emitter and a promise to resolve when it finishes up. */
						var hist = commit.history(),
							p = new Promise(function(resolve, reject) {
								hist.on('end', resolve)
								hist.on('error', reject)
							})
						hist.start()
						return p
					})
					.then(function(commits) {
						let allCommits = []
						allCommits = commits.map(commit => ({
							// return {
							sha: commit.sha(),
							message: commit.message().split('\n')[0],
							time: commit.date(),
							// }
						}))
						resolve({ allCommits })
					})
			})
			.catch(function(err) {
				console.log(err)
			})
	})
}

const removeAndCommit = (filepath, gitmessage) => {
	return new Promise((resolve, reject) => {
		let filepathArray = filepath.split('/')
		let directoryName = './'
		for (let i = 2; i < filepathArray.length - 1; i++) {
			directoryName += filepathArray[i] + '/'
		}

		let fileName = filepathArray[filepathArray.length - 1]
		var _repository
		var _index
		var _oid
		nodegit.Repository.open('./filesystem')
			.then(function(repo) {
				_repository = repo
				return repo.refreshIndex()
			})
			.then(function(index) {
				_index = index
			})
			.then(function() {
				//remove the file from the index...
				return _index.removeByPath(fileName)
			})
			.then(function() {
				return _index.write()
			})
			.then(function() {
				return _index.writeTree()
			})
			.then(function(oid) {
				_oid = oid
				return nodegit.Reference.nameToId(_repository, 'HEAD')
			})
			.then(function(head) {
				return _repository.getCommit(head)
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

				return _repository.createCommit(
					'HEAD',
					author,
					committer,
					stringMessage,
					_oid,
					[parent]
				)
			})
			.then(function(commitId) {
				// the file is removed from the git repo, use fs.unlink now to remove it
				// from the filesystem.
				resolve({ CommitId: commitId })
			})
			.done()
	})
}

module.exports = {
	addAndCommit,
	removeAndCommit,
	commitLog,
}
