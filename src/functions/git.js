const fs = require('fs')
const git = require('isomorphic-git')
const path = require('path')

git.plugins.set('fs', fs)

const { repoDir, getRelFilePath } = require('../utils/parsePath')

const addAndCommit = (filePath, author, committer, message) => {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            git.add({
                dir: repoDir(filePath),
                filepath: getRelFilePath(filePath),
            })
            const sha = git.commit({
                dir: repoDir(filePath),
                author,
                committer,
                message,
            })
            return resolve(sha)
        }
        return reject(`File: ${path.basename(filePath)} doesn't exist!`)
    })
}

const removeAndCommit = (filePath, author, committer) => {
    return new Promise(resolve => {
        git.remove({
            dir: repoDir(filePath),
            filepath: getRelFilePath(filePath),
        })
        const sha = git.commit({
            dir: repoDir(filePath),
            author,
            committer,
            message: `Deleted: ${path.basename(filePath)}`,
        })
        return resolve(sha)
    })
}

module.exports = {
    addAndCommit,
    removeAndCommit,
}
