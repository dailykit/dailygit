const path = require('path')
const getFilesRecursively = require('recursive-readdir')

const getFilePaths = async givenPath => {
	function ignoreFunc(file) {
		return path.basename(file) === '.git'
	}
	return new Promise((resolve, reject) => {
		getFilesRecursively(givenPath, [ignoreFunc], (err, files) => {
			if (err) return reject(new Error(err))
			const result = files.map(file => `./${file.split('\\').join('/')}`)
			return resolve(result)
		})
	})
}

module.exports = getFilePaths
