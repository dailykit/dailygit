const fs = require('fs')
const git = require('isomorphic-git')
const path = require('path')

const nodegit = require('nodegit')
const { CherrypickOptions, MergeOptions } = require('nodegit')

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
					let cherrypickOptions = new CherrypickOptions()

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

const createBranch = async (repo, name, author) => {
	// Create Branch
	const create = await git.branch({ dir: repo, ref: name, checkout: true })

	// List files in branch
	const clean = await git
		.listFiles({ dir: repo, ref: name })
		.then(async files => {
			// Delete files
			const remove = await files.map(file => {
				return fs.unlink(`${repo}/${file}`, async error => {
					if (error) return new Error(error)
					// Remove file from indexing
					return await git.remove({ dir: repo, filepath: file })
				})
			})

			// Commit deleted files
			const commit = await git
				.commit({
					dir: repo,
					author: author,
					message: 'Clean Up',
				})
				.catch(error => new Error(error))

			// Checkout to master
			const checkout = await git.checkout({
				dir: repo,
				ref: 'master',
				checkout: true,
			})
			return Promise.all([remove, commit, checkout])
		})

	return Promise.all([create, clean]).catch(error => new Error(error))
}

module.exports = {
	stageChanges,
	gitCommit,
	cherryPickCommit,
	commitToBranch,
	checkoutBranch,
	createBranch,
}
