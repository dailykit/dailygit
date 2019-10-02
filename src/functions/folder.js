const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const getFilesRecursively = require('recursive-readdir')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const files = require('./file')
const getFolderSize = require('../utils/getFolderSize')

const baseFolder = './../apps/'

const getRepoPath = givenPath =>
	givenPath
		.split(baseFolder)
		.filter(Boolean)[0]
		.split('/')
		.slice(0, 3)
		.join('/')

const getRelFilePath = givenPath =>
	givenPath
		.split(baseFolder)
		.filter(Boolean)[0]
		.split('/')
		.slice(3)
		.join('/')

const getNestedFolders = async url => {
	let content = await fs.readdirSync(url)
	let folders = content.filter(
		item => fs.statSync(`${url}/${item}`).isDirectory() && item[0] !== '.'
	)
	let nestedData = folders.map(async folder => {
		const stats = fs.statSync(`${url}/${folder}`)
		if (stats.isDirectory()) {
			let node = {}
			node.name = folder
			node.path = `${url}/${folder}`
			node.type = 'folder'
			node.createdAt = stats.birthtime
			const folderSize = await getFolderSize(`${url}/${folder}`)
				.map(file => fs.readFileSync(file))
				.join('\n')
			node.size = folderSize.length
			let children = await getNestedFolders(`${url}/${folder}`)
			node.children = children
			return node
		}
	})
	return Promise.all(nestedData).then(response => response)
}

const getFolderWithFiles = async url => {
	try {
		let data = await fs.readdirSync(url)
		let nestedData = data
			.filter(item => item[0] !== '.')
			.map(async item => {
				const stats = fs.statSync(`${url}/${item}`)
				let node = {}
				node.name = item
				node.path = `${url}/${item}`
				node.createdAt = stats.birthtime
				if (stats.isFile()) {
					const fileData = await files.getFile(`${url}/${item}`)
					node.content = fileData.content
					node.size = stats.size
					node.type = 'file'
				} else if (stats.isDirectory()) {
					let functionResponse = await getFolderWithFiles(
						`${url}/${item}`
					)
					node.children = functionResponse
					node.type = 'folder'
					const folderSize = await getFolderSize(`${url}/${item}`)
						.map(file => fs.readFileSync(file))
						.join('\n')
					node.size = folderSize.length
				}
				return node
			})
		return Promise.all(nestedData).then(result => result)
	} catch (e) {
		console.log(e)
	}
}

const createFolder = async url => {
	return new Promise((resolve, reject) => {
		fs.mkdir(
			url,
			{
				recursive: true,
			},
			err => {
				if (err) return reject(err)
				return resolve('Folder created successfuly!')
			}
		)
	})
}

const deleteFolder = givenPath => {
	return new Promise(async (resolve, reject) => {
		// Get all file paths from the folder
		const allFilePaths = await getPathsOfAllFilesInFolder(givenPath).then(
			files => files
		)

		for (let file of allFilePaths) {
			// Remove the file from the git index
			git.remove({
				dir: `${baseFolder}${getRepoPath(file)}`,
				filePath: `${getRelFilePath(file)}/${path.basename(file)}`,
			}).catch(error => reject(new Error(error)))

			// Commit the deleted file
			git.commit({
				dir: `${baseFolder}${getRepoPath(file)}`,
				author: {
					name: 'placeholder',
					email: 'placeholder@example.com',
				},
				commiter: {
					name: 'placeholder',
					email: 'placeholder@example.com',
				},
				message: `Deleted: ${path.basename(file)}`,
			})
				.then(sha => console.log({ sha }))
				.catch(error => reject(new Error(error)))

			// Delete the file
			fs.unlink(file, err => {
				if (err) return reject(new Error(err))
			})
		}
		rimraf(givenPath, err => {
			if (err) return err
			resolve(`Deleted : ${path.basename(givenPath)} folder`)
		})
	})
}

const renameFolder = (oldPath, newPath) => {
	return new Promise((resolve, reject) => {
		fs.rename(oldPath, newPath, function(err) {
			if (err) {
				return reject(err)
			}
			return resolve('Folder has been renamed successfully!')
		})
	})
}

const getPathsOfAllFilesInFolder = async givenPath => {
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

module.exports = {
	createFolder,
	deleteFolder,
	renameFolder,
	getNestedFolders,
	getFolderWithFiles,
}
