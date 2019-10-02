const fs = require('fs')
const path = require('path')
const getFilesRecursively = require('recursive-readdir')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const { getRelFilePath, getRepoPath } = require('../utils/parsePath')

const baseFolder = './../apps/'

const createFile = ({ path: givenPath, content }) => {
	return new Promise((resolve, reject) => {
		// Check if folder exists
		if (!fs.existsSync(path.dirname(givenPath))) {
			fs.mkdirSync(path.dirname(givenPath), { recursive: true })
		}

		// Create the file
		fs.writeFileSync(givenPath, JSON.stringify(content, null, 2))

		// Stage the file
		git.add({
			dir: `${baseFolder}${getRepoPath(givenPath)}`,
			filePath: `${getRelFilePath(givenPath)}/${path.basename(
				givenPath
			)}`,
		}).catch(error => reject(new Error(error)))

		// Commit the file
		git.commit({
			dir: `${baseFolder}${getRepoPath(givenPath)}`,
			author: {
				name: 'placeholder',
				email: 'placeholder@example.com',
			},
			commiter: {
				name: 'placeholder',
				email: 'placeholder@example.com',
			},
			message: `Added: ${path.basename(givenPath)}`,
		})
			.then(sha => console.log({ sha }))
			.catch(error => reject(new Error(error)))

		return resolve(`Added: ${path.basename(givenPath)}`)
	})
}

const deleteFile = givenPath => {
	return new Promise((resolve, reject) => {
		// Remove the file from the git index
		git.remove({
			dir: `${baseFolder}${getRepoPath(givenPath)}`,
			filePath: `${getRelFilePath(givenPath)}/${path.basename(
				givenPath
			)}`,
		}).catch(error => reject(new Error(error)))

		// Commit the deleted file
		git.commit({
			dir: `${baseFolder}${getRepoPath(givenPath)}`,
			author: {
				name: 'placeholder',
				email: 'placeholder@example.com',
			},
			commiter: {
				name: 'placeholder',
				email: 'placeholder@example.com',
			},
			message: `Deleted: ${path.basename(givenPath)}`,
		})

		// Delete the file
		fs.unlink(givenPath, err => {
			if (err) return reject(new Error(err))
			return resolve(`Deleted: ${path.basename(givenPath)}`)
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

const searchFiles = async fileName => {
	function ignoreFunc(file) {
		return path.basename(file) === '.git'
	}
	return new Promise((resolve, reject) => {
		getFilesRecursively('./../apps', [ignoreFunc], (err, files) => {
			if (err) return reject(new Error(err))
			const formatted = files
				.map(file => `./${file.split('\\').join('/')}`)
				.filter(file =>
					path
						.basename(file)
						.toLowerCase()
						.includes(fileName.toLowerCase())
				)
			const result = {
				menus: [],
				packages: [],
				ingredients: [],
				recipes: [],
				dishes: [],
			}
			formatted.map(file => {
				const type = file.split('/')[2].toLowerCase()
				switch (type) {
					case 'dishes':
						return result.dishes.push(file)
					case 'packages':
						return result.packages.push(file)
					case 'recipes':
						return result.recipes.push(file)
					case 'ingredients':
						return result.ingredients.push(file)
					case 'menus':
						return result.menus.push(file)
					default:
						break
				}
			})
			return resolve(result)
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
	searchFiles,
}
