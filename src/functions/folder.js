const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const getFilesRecursively = require('recursive-readdir')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const files = require('./file')
const getFolderSize = require('../utils/getFolderSize')

const { getRelFilePath, getRepoPath } = require('../utils/parsePath')
const { stageChanges } = require('./git')

const baseFolder = './../apps/'

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
		const repoDir = `${baseFolder}${getRepoPath(givenPath)}`
		for (let file of allFilePaths) {
			fs.unlink(file, err => {
				if (err) return reject(new Error(err))
				// Remove the file from the git index
				stageChanges('remove', repoDir, getRelFilePath(file)).catch(
					error => reject(new Error(error))
				)

				// Commit the deleted file
				git.commit({
					dir: repoDir,
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
			})
		}
		rimraf(givenPath, err => {
			if (err) return err
			resolve(`Deleted : ${path.basename(givenPath)} folder`)
		})
	})
}

const renameFolder = (oldPath, newPath) => {
	return new Promise(async (resolve, reject) => {
		// Check if newPath file exists
		if (oldPath === newPath) {
			return resolve("New name can't be the same old name!")
		} else if (fs.existsSync(newPath)) {
			return resolve('Folder already exists!')
		}

		// Get list of all file paths in before renaming folder
		const oldFilePaths = await getPathsOfAllFilesInFolder(oldPath).then(
			files => files
		)
		fs.rename(oldPath, newPath, async error => {
			if (error) return reject(new Error(error))

			// Get list of all file paths in renamed folder
			const newFilePaths = await getPathsOfAllFilesInFolder(newPath).then(
				files => files
			)
			const repoDir = `${baseFolder}${getRepoPath(oldPath)}`

			// Remove all the old files from git index
			for (let oldFilePath of oldFilePaths) {
				stageChanges(
					'remove',
					repoDir,
					getRelFilePath(oldFilePath)
				).catch(error => reject(new Error(error)))
			}

			// Add all the new files to staging and commit them
			for (let newFilePath of newFilePaths) {
				stageChanges('add', repoDir, getRelFilePath(newFilePath)).catch(
					error => reject(new Error(error))
				)
				git.commit({
					dir: `${baseFolder}${getRepoPath(oldPath)}`,
					author: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					commiter: {
						name: 'placeholder',
						email: 'placeholder@example.com',
					},
					message: `Renamed: Parent folder from ${path.basename(
						oldPath
					)} to ${path.basename(newPath)}`,
				}).then(sha => console.log(sha))
			}
			resolve(
				`Renamed: From ${path.basename(oldPath)} to ${path.basename(
					newPath
				)}`
			)
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
