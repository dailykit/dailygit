const fs = require('fs')
const path = require('path')

const files = require('./file')
const getFolderSize = require('../utils/getFolderSize')

const getNestedFolders = async url => {
	let content = await fs.readdirSync(url)
	let folders = content.filter(item =>
		fs.statSync(`${url}/${item}`).isDirectory()
	)
	let result = folders.map(async folder => {
		if (fs.statSync(`${url}/${folder}`).isDirectory()) {
			const stats = fs.statSync(`${url}/${folder}`)
			let parentFolder = {}
			parentFolder.name = folder
			parentFolder.path = `${url}/${folder}`
			parentFolder.type = 'folder'
			parentFolder.createdAt = stats.birthtime
			const folderSize = await getFolderSize(`${url}/${folder}`)
				.map(file => fs.readFileSync(file))
				.join('\n')
			parentFolder.size = folderSize.length
			let children = await getNestedFolders(`${url}/${folder}`)
			parentFolder.children = children
			return parentFolder
		}
	})
	return Promise.all(result).then(response => response)
}

const getNestedFoldersWithFiles = async (url = './filesystem') => {
	try {
		let data = await fs.readdirSync(url)
		let intermediateData = data.map(async file => {
			const stats = fs.statSync(`${url}/${file}`)
			let returnObject = {}
			returnObject.name = file
			returnObject.path = `${url}/${file}`
			returnObject.createdAt = stats.birthtime
			if (fs.statSync(`${url}/${file}`).isFile()) {
				const fileData = await files.getFile(`${url}/${file}`)
				returnObject.content = fileData.content
			}
			let filenamearray = file.split('')
			if (filenamearray[0] !== '.' && file !== 'node_modules') {
				if (fs.lstatSync(`${url}/${file}`).isDirectory()) {
					let functionResponse = await getNestedFoldersWithFiles(
						`${url}/${file}`
					)
					returnObject.children = functionResponse
					returnObject.type = 'folder'
					const folderSize = await getFolderSize(`${url}/${file}`)
						.map(file => fs.readFileSync(file))
						.join('\n')
					returnObject.size = folderSize.length
					return returnObject
				} else {
					returnObject.size = stats.size
					returnObject.type = 'file'
					return returnObject
				}
			} else {
				returnObject.size = stats.size
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
	getNestedFolders,
	getNestedFoldersWithFiles,
}
