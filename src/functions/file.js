const fs = require('fs')
const path = require('path')

const createFile = (givenPath, givenType) => {
	return new Promise((resolve, reject) => {
		let source = `./src/templates/${givenType}.json`
		let destination = `./${givenPath.split('./')[1]}`
		if (fs.existsSync(source)) {
			fs.copyFile(source, destination, err => {
				if (err) return reject(new Error('File could not be created!'))
				return resolve('File created successfully!')
			})
		} else {
			reject(new Error(`Template file ${givenType} doesn't exists!`))
		}
	})
}

const deleteFile = givenPath => {
	return new Promise((resolve, reject) => {
		fs.unlink(givenPath, err => {
			if (err) return reject("File doesn't exist!")
			return resolve('File deleted succesfully')
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

const renameFile = async (oldPath, newPath) => {
	return new Promise((resolve, reject) => {
		fs.rename(oldPath, newPath, function(err) {
			if (err) {
				return reject(err)
			}
		})
		resolve('File has been renamed successfully!')
	})
}

module.exports = {
	createFile,
	deleteFile,
	getFile,
	updateFile,
	renameFile,
}