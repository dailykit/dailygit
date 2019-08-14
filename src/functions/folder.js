const fs = require('fs')
const path = require('path')

const files = require('./file')

const getNestedFolders = async url => {
	let content = await fs.readdirSync(url)
	let folders = content.filter(item =>
		fs.statSync(`${url}/${item}`).isDirectory()
	)
	let result = folders.map(async folder => {
		if (fs.statSync(`${url}/${folder}`).isDirectory()) {
			let parentFolder = {}
			parentFolder.name = folder
			parentFolder.path = `${url}/${folder}`
			parentFolder.type = 'folder'
			let children = await getNestedFolders(`${url}/${folder}`)
			parentFolder.children = children
			return parentFolder
		}
	})
	return Promise.all(result).then(response => response)
}

const getFolder = async (url = './filesystem') => {
	try {
		let data = await fs.readdirSync(url)
		let intermediateData = data.map(async file => {
			let returnObject = {}
			returnObject.name = file
			returnObject.path = url + '/' + file
			if (fs.statSync(url + '/' + file).isFile()) {
				const fileData = await files.getFile(url + '/' + file)
				returnObject.content = fileData.content
			}
			let filenamearray = file.split('')
			if (filenamearray[0] !== '.' && file !== 'node_modules') {
				if (fs.lstatSync(url + '/' + file).isDirectory()) {
					let functionResponse = await getFolder(url + '/' + file)
					returnObject.children = functionResponse
					returnObject.type = 'folder'
					return returnObject
				} else {
					const stats = fs.statSync(url + '/' + file)
					returnObject.size = stats.size
					returnObject.createdAt = stats.birthtime
					returnObject.type = 'file'
					return returnObject
				}
			} else {
				const stats = fs.statSync(url + '/' + file)
				returnObject.size = stats.size
				returnObject.createdAt = stats.birthtime
				returnObject.type = 'file'
			}
			return returnObject
		})
		return Promise.all(intermediateData).then(result => ({
			name: path.parse(url).name,
			path: url,
			type: 'folder',
			children: result,
		}))
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
	getNestedFolders,
}
