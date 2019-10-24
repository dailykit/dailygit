const fs = require('fs')
const git = require('isomorphic-git')
const path = require('path')

const nodegit = require('nodegit')
const { CherrypickOptions, MergeOptions, Branch } = require('nodegit')

git.plugins.set('fs', fs)

const { repoDir } = require('../utils/parsePath')

const stageChanges = (type, dir, filepath) => {
	return new Promise((resolve, reject) => {
		if (type === 'add') {
			git.add({
				dir,
				filepath,
			}).catch(error => reject(new Error(error)))
			return resolve(1)
		} else if (type === 'remove') {
			git.remove({
				dir,
				filepath,
			}).catch(error => reject(new Error(error)))
			return resolve(1)
		}
	})
}

const gitCommit = (givenPath, author, committer, message) => {
	return git
		.commit({
			dir: repoDir(givenPath),
			author: author,
			commiter: committer,
			message: message,
		})
		.then(sha => sha)
}

const cherryPickCommit = (sha, givenPath) => {
	return new Promise((resolve, reject) => {
		const pathArray = givenPath.split('/')
		const dataIndex = pathArray.indexOf('data') + 1

		let newArray = []
		for (let i = 0; i < dataIndex + 1; i++) {
			newArray.push(pathArray[i])
		}
		let repoPath = newArray.join('/')
		repoPath += '/'
		console.log(repoPath)

		nodegit.Repository.open(repoPath)
			.then(repo => {
				nodegit.Commit.lookup(repo, sha).then(commit => {
					const cherrypickOptions = new CherrypickOptions()

					cherrypickOptions = {
						mergeOpts: new MergeOptions(),
					}

					cherrypickOptions.mergeOpts.fileFavor = 2
					nodegit.Cherrypick.cherrypick(
						repo,
						commit,
						cherrypickOptions
					)
						.then(int => {})
						.catch(error => reject(new Error(error)))
				})
			})
			.catch(error => reject(new Error(error)))
		return resolve()
	})
}

const checkoutBranch = (branch, givenPath) => {
	return new Promise((resolve, reject) => {
		const pathArray = givenPath.split('/')
		const dataIndex = pathArray.indexOf('data') + 1
		let newArray = []
		for (let i = 0; i < dataIndex + 1; i++) {
			newArray.push(pathArray[i])
		}
		let repoPath = newArray.join('/')
		repoPath += '/'
		console.log(repoPath)
		nodegit.Repository.open(repoPath)
			.then(repo => {
				return repo
					.checkoutBranch(branch, {
						checkoutStrategy: nodegit.Checkout.STRATEGY.FORCE,
					})
					.then(() => {
						resolve()
					})
			})
			.catch(error => reject(new Error(error)))
	})
}

const doesBranchExists = (branch_name, givenPath) => {
	const pathArray = givenPath.split('/')
	const dataIndex = pathArray.indexOf('data') + 1
	let newArray = []
	for (let i = 0; i < dataIndex + 1; i++) {
		newArray.push(pathArray[i])
	}
	let repoPath = newArray.join('/')
	repoPath += '/'
	console.log(repoPath)

	nodegit.Repository.open(repoPath)
		.then(repo => {
			nodegit.Branch.lookup(repo, branch_name, 1)
				.then(function(reference) {
					// Use reference
					console.log(reference)
					if (!reference) {
						console.log("Branch Doesn't exist")
					} else {
						console.log('Branch exists')
					}
					nodegit.Branch.name(reference).then(function(newString) {
						console.log(newString)
						if (!newString) {
							console.log('nothing')
						}
					})
				})
				.catch(error => reject(new Error(error)))
		})
		.catch(error => reject(new Error(error)))
}

const commitToBranch = (validFor, sha, givenPath, author, committer) => {
	validFor.forEach(branch => {
		checkoutBranch(branch, givenPath).then(() => {
			cherryPickCommit(sha, givenPath).then(() => {
				gitCommit(
					givenPath,
					author,
					committer,
					`Updated: ${path.basename(
						givenPath
					)} file in branch ${branch}...`
				).then(() => {
					checkoutBranch('master', givenPath)
				})
			})
		})
	})
}

const createBranch = async (master, branch) => {
	await git.branch({ dir: master, ref: branch, checkout: true }).then(() => {
		return git.listFiles({ dir: master, ref: branch }).then(files => {
			return files.map(file => {
				return fs.unlink(`${master}/${file}`, err => {
					if (err) console.log(err)
					git.remove({
						dir: master,
						filepath: file,
					})
					git.commit({
						dir: master,
						author: {
							name: 'Mr. Test',
							email: 'mrtest@example.com',
						},
						message: 'cleanup',
					})
				})
			})
		})
	})
}

module.exports = {
	stageChanges,
	gitCommit,
	cherryPickCommit,
	commitToBranch,
	checkoutBranch,
}
