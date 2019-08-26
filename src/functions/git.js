var nodegit = require('nodegit')
var path = require('path')

const commitLog = () => {
	return new Promise((resolve, reject) => {
		nodegit.Repository.open('./filesystem')
			.then(function(repo) {
				/* Get the current branch. */
				return repo
					.getCurrentBranch()
					.then(function(ref) {
						console.log(
							'On ' + ref.shorthand() + ' (' + ref.target() + ')'
						)

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
						console.log(allCommits)
						resolve({ allCommits })
					})
			})
			.catch(function(err) {
				console.log(err)
			})
			.done(function() {
				// resolve({returnObject});
				console.log('Finished')
			})
	})
}

module.exports = {
	commitLog,
}
