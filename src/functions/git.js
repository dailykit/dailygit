const fs = require('fs')
const git = require('isomorphic-git')
const path = require('path')

git.plugins.set('fs', fs)

const { repoDir, getRelFilePath } = require('../utils/parsePath')

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

const addAndCommit = async (givenPath, author, committer) => {
	try {
		await git.add({
			dir: repoDir(givenPath),
			filepath: getRelFilePath(givenPath),
		})
		const sha = git.commit({
			dir: repoDir(givenPath),
			author,
			committer,
			message: `Added: ${path.basename(givenPath)}`,
		})

		return sha
	} catch (error) {
		throw error
	}
}

const removeAndCommit = async (givenPath, author, committer) => {
	try {
		await git.remove({
			dir: repoDir(givenPath),
			filepath: getRelFilePath(givenPath),
		})
		const sha = git.commit({
			dir: repoDir(givenPath),
			author,
			committer,
			message: `Deleted: ${path.basename(givenPath)}`,
		})

		return sha
	} catch (error) {
		throw error
	}
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

module.exports = {
	stageChanges,
	gitCommit,
	addAndCommit,
	removeAndCommit,
}
