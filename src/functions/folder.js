const fs = require('fs')
const path = require('path')

const files = require('./file')

const getFolder = async (testFolder = './filesystem') => {
	try {
		let data = await fs.readdirSync(testFolder) //, (err, files) => {
		let intermediateData = data.map(async file => {
			let returnObject = {}
			returnObject.name = file
			returnObject.path = testFolder + '/' + file
			if (fs.statSync(testFolder + '/' + file).isFile()) {
				const fileData = await files.getFile(testFolder + '/' + file)
				returnObject.content = fileData.content
			}
			let filenamearray = file.split('')
			if (filenamearray[0] !== '.' && file !== 'node_modules') {
				if (fs.lstatSync(testFolder + '/' + file).isDirectory()) {
					let functionResponse = await getFolder(
						testFolder + '/' + file
					)
					returnObject.children = functionResponse
					returnObject.type = 'folder'
					return returnObject
				} else {
					const stats = fs.statSync(testFolder + '/' + file)
					returnObject.size = stats.size
					returnObject.createdAt = stats.birthtime
					returnObject.type = 'file'
					return returnObject
				}
			} else {
				const stats = fs.statSync(testFolder + '/' + file)
				returnObject.size = stats.size
				returnObject.createdAt = stats.birthtime
				returnObject.type = 'file'
			}
			return returnObject
		})
		return Promise.all(intermediateData).then(result => result)
	} catch (e) {
		console.log(e)
	}
}

const createFolder = async url => {
	if (fs.existsSync(url)) {
		return 'Folder already exists!'
	}
	fs.mkdir(
		url,
		{
			recursive: true,
		},
		err => {
			if (err) {
				console.log(err)
			}
		}
	)
	return 'Folder created successfuly!'
}

const deleteFolder = dirPath => {
	if (!fs.existsSync(dirPath)) {
		return "Folder doesn't exist!"
	}

	let list = fs.readdirSync(dirPath)
	for (var i = 0; i < list.length; i++) {
		var filename = path.join(dirPath, list[i])
		console.log('filename', filename)
		var stat = fs.statSync(filename)

		if (filename == '.' || filename == '..') {
			// do nothing for current and parent dir
		} else if (stat.isDirectory()) {
			deleteFolder(filename)
		} else {
			fs.unlinkSync(filename)
		}
	}
	if (list.length === 0) {
		fs.rmdirSync(dirPath)
	}
}

module.exports = {
	createFolder,
	deleteFolder,
	getFolder,
}
