const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const files = require('./file')
const getFolderSize = require('../utils/getFolderSize')

const database = require('./database')

const { getRelFilePath, repoDir } = require('../utils/parsePath')
const { stageChanges } = require('./git')

const getNestedFolders = async url => {
	try {
		let content = await fs.readdirSync(url)
		let folders = await content.filter(
			item =>
				fs.statSync(`${url}/${item}`).isDirectory() &&
				item !== '.git' &&
				item !== 'schema'
		)
		let result = folders.map(async folder => {
			const stats = fs.statSync(`${url}/${folder}`)
			if (stats.isDirectory()) {
				let node = {}
				node.name = folder
				node.path = `${url}/${folder}`
				let children = await getNestedFolders(`${url}/${folder}`)
				node.children = children
				return node
			}
		})
		return result
	} catch (error) {
		return new Error(error)
	}
}

const getFolderWithFiles = async url => {
	try {
		const data = await fs.readdirSync(url)
		const result = await data
			.filter(item => item !== '.git' && item !== 'schema')
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
						.filter(Boolean)
						.map(file => fs.readFileSync(file))
						.join('\n')
					node.size = folderSize.length
				}
				return node
			})
		return result
	} catch (error) {
		return new Error(error)
	}
}

const createFolder = givenPath => {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(givenPath)) {
			return reject(`Folder: ${path.basename(givenPath)} already exist!`)
		}
		return fs.mkdir(givenPath, { recursive: true }, error => {
			if (error) return reject(new Error(error))
			return resolve()
		})
	})
}

const deleteFolder = filePath => {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(filePath)) {
			// Delete the folder
			return rimraf(filePath, error => {
				if (error) return reject(new Error(error))
				return resolve()
			})
		}
		return reject(`Folder: ${path.basename(filePath)} doesn't exist!`)
	})
}

const renameFolder = (oldPath, newPath) => {
	return new Promise((resolve, reject) => {
		// Check if newPath file exists
		if (oldPath === newPath) {
			return resolve("New name can't be the same old name!")
		} else if (fs.existsSync(newPath)) {
			return resolve('Folder already exists!')
		}

		// Get list of all file paths in before renaming folder
		const oldFilePaths = getPathsOfAllFilesInFolder(oldPath).then(
			files => files
		)
		fs.rename(oldPath, newPath, async error => {
			if (error) return reject(new Error(error))

			// Get list of all file paths in renamed folder
			const newFilePaths = await getPathsOfAllFilesInFolder(newPath).then(
				files => files
			)

			// Remove all the old files from git index
			for (let oldFilePath of oldFilePaths) {
				stageChanges(
					'remove',
					repoDir(oldPath),
					getRelFilePath(oldFilePath)
				).catch(error => reject(new Error(error)))
			}

			// Add all the new files to staging and commit them
			const author = {
				name: 'placeholder',
				email: 'placeholder@example.com',
			}
			const committer = {
				name: 'placeholder',
				email: 'placeholder@example.com',
			}
			for (let newFilePath of newFilePaths) {
				stageChanges(
					'add',
					repoDir(oldPath),
					getRelFilePath(newFilePath)
				).catch(error => reject(new Error(error)))
				git.commit({
					dir: repoDir(oldPath),
					author,
					committer,
					message: `Renamed: Parent folder from ${path.basename(
						oldPath
					)} to ${path.basename(newPath)}`,
				}).then(sha =>
					database
						.updateFile({
							commit: sha,
							path:
								oldFilePaths[newFilePaths.indexOf(newFilePath)],
							newPath: newFilePath,
						})
						.catch(error => reject(new Error(error)))
				)
			}
			resolve(
				`Renamed: From ${path.basename(oldPath)} to ${path.basename(
					newPath
				)}`
			)
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
