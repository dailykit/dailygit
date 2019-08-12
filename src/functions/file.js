const fs = require('fs')
const path = require('path')

const createFile = (givenPath, givenType) => {
	return new Promise((resolve, reject) => {
		let newFilePath = '/' + givenPath.split('./')[1]

		var fullPath = process.cwd()
		let sourceFilePath = `${fullPath}\\src\\templates\\${givenType}.json`
		let destinationFilePath = fullPath + newFilePath.split('/').join('\\')
		fs.copyFile(sourceFilePath, destinationFilePath, err => {
			if (!err) {
				resolve('File successfully created!')
			}
			reject('File could not be created')
		})
	})
}

const deleteFile = givenPath => {
	return new Promise((resolve, reject) => {
		fs.unlink(givenPath, err => {
			if (err) reject("File doesn't exist!")
			resolve('File deleted succesfully')
		})
	})
}

module.exports = {
	createFile,
	deleteFile,
}
