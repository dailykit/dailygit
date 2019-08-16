const fs = require('fs')
const path = require('path')

const createFile = (givenPath, givenType) => {
	try {
		let newFilePath = '/' + givenPath.split('./')[1]
		var fullPath = process.cwd()
		let sourceFilePath = `${fullPath}\\src\\templates\\${givenType}.json`
		let destinationFilePath = fullPath + newFilePath.split('/').join('\\')
		fs.copyFileSync(sourceFilePath, destinationFilePath)
		return 'File created successfully!'
	} catch (err) {
		return new Error(err)
	}
}

const deleteFile = givenPath => {
	return new Promise((resolve, reject) => {
		fs.unlink(givenPath, err => {
			if (err) reject("File doesn't exist!")
			resolve('File deleted succesfully')
		})
	})
}

const getFile = givenPath => {
	return new Promise((resolve, reject) => {
		const stats = fs.statSync(givenPath)
		const parse = path.parse(givenPath)
		fs.readFile(givenPath, (err, data) => {
			if (err) reject(err)
			resolve({
				name: parse.name,
				path: givenPath,
				size: stats.size,
				createdAt: stats.birthtime,
				type: 'file',
				content: data.toString(),
			})
		})
	})
}

const updateFile = async (givenPath, data) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(givenPath, data, function(err) {
			if (err) {
				return reject(err)
			}
		})
		resolve('File has been updated successfully!')
	})
}

module.exports = {
	createFile,
	deleteFile,
	getFile,
	updateFile,
}
