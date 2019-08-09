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

const deleteFolder = url =>
	new Promise((resolve, reject) => {
		fs.rmdir(url, err => {
			if (!err) {
				resolve('Folder deleted succesfully!')
			}
			return reject(err)
		})
	})

module.exports = {
	createFolder,
	deleteFolder,
}
