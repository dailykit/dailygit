const fs = require('fs')
const path = require('path')

const getFoldersInDirectory = source =>
	fs
		.readdirSync(source, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name)

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
	if (getFoldersInDirectory(dirPath).length === 0) {
		fs.rmdirSync(dirPath)
	}
}

module.exports = {
	createFolder,
	deleteFolder,
}
