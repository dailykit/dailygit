const path = require('path')
const fs = require('fs')
const getFilesRecursively = require('recursive-readdir')

const getFilePaths = async givenPath => {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(givenPath)) {
            const ignoreFunc = file => {
                return path.basename(file) === '.git'
            }
            return getFilesRecursively(
                givenPath,
                [ignoreFunc],
                (err, files) => {
                    if (err) return reject(new Error(err))
                    const result = files
                        .map(file => `./${file.split('\\').join('/')}`)
                        .sort((a, b) =>
                            path.basename(a) < path.basename(b) ? -1 : 1
                        )
                    return resolve(result)
                }
            )
        }
        return reject(`Folder: ${path.basename(givenPath)} doesn't exists!`)
    })
}

module.exports = getFilePaths
