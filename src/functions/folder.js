const fs = require('fs')

const getFoldersInDirectory = source =>
	fs
		.readdirSync(source, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name)

const createFolder = async path => {
	const folderName = (await path.split('/').slice(-1)) + ''
	const parentDirectory =
		(await path
			.split('/')
			.slice(0, -1)
			.join('/')) + '/'
	const foldersList = await getFoldersInDirectory(parentDirectory)
	if (foldersList.includes(folderName)) {
		return 'Folder already exists!'
	}
	fs.mkdir(
		path,
		{
			recursive: true,
		},
		err => console.log(err)
	)
	return 'Created!'
}
// fs.rmdir(path, err => new Error(err))
const deleteFolder = async path => {
	return new Promise((resolve, reject) => {
		fs.rmdir(path, err => {
			if (!err) {
				resolve('Folder deleted succesfully!')
			}
			return reject(err)
		})
	})
}

module.exports = {
	createFolder,
	deleteFolder,
}

// rename if it exists assign default name
