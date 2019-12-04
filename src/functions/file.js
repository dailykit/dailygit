const fs = require('fs')
const path = require('path')
const getFilesRecursively = require('recursive-readdir')
const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const database = require('./database')

const {
	getRelFilePath,
	repoDir,
	getAppName,
	baseFolder,
} = require('../utils/parsePath')
const { stageChanges, gitCommit } = require('./git')

const createFile = (filePath, content) => {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(filePath)) {
			return reject(`File: ${path.basename(filePath)} already exists!`)
		}
		return fs.writeFile(
			filePath,
			JSON.stringify(content, null, 2),
			error => {
				if (error) return reject(new Error(error))
				return resolve(
					`File ${path.basename(filePath)} has been created`
				)
			}
		)
	})
}

const deleteFile = async filePath => {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(filePath)) {
			return fs.unlink(filePath, error => {
				if (error) return reject(new Error(error))
				return resolve(`Deleted: ${path.basename(filePath)}`)
			})
		}
		return reject(`File ${path.basename(filePath)} doesn't exists`)
	})
}

const getFile = givenPath => {
	return new Promise((resolve, reject) => {
		const stats = fs.statSync(givenPath)
		const parse = path.parse(givenPath)
		fs.readFile(givenPath, (error, data) => {
			if (error) reject(new Error(error))
			return database
				.readFile(givenPath)
				.then(doc => {
					const file = {
						name: parse.name,
						path: givenPath,
						size: stats.size,
						createdAt: stats.birthtime,
						type: 'file',
						content: data.toString(),
						commits: doc.commits,
						lastSaved: doc.lastSaved,
					}
					return resolve(file)
				})
				.catch(error => reject(new Error(error)))
		})
	})
}

const searchFiles = async fileName => {
	function ignoreFunc(file) {
		return (
			path.basename(file) === '.git' || path.basename(file) === 'schema'
		)
	}
	return new Promise((resolve, reject) => {
		getFilesRecursively(baseFolder, [ignoreFunc], (err, files) => {
			if (err) return reject(new Error(err))
			const paths = files
				.map(file => `./${file.replace(/\\/g, '/')}`)
				.filter(file =>
					path
						.basename(file)
						.toLowerCase()
						.includes(fileName.toLowerCase())
				)
			const apps = {}
			paths.forEach(path => {
				let key = getAppName(path)
				apps[key] = []
			})
			paths.forEach(path => {
				let key = getAppName(path)
				apps[key] = [...apps[key], path]
			})
			return resolve(JSON.stringify(apps))
		})
	})
}

const updateFile = async (filePath, content) => {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(filePath)) {
			return fs.writeFile(filePath, content, err => {
				if (err) return reject(new Error(err))
				resolve(`Updated: ${path.basename(filePath)} file`)
			})
		}
		return reject(`File ${path.basename(filePath)} doesn't exists`)
	})
}

const renameFile = async (oldPath, newPath) => {
	return new Promise((resolve, reject) => {
		// Check if newPath file exists
		if (oldPath === newPath) {
			return reject("New name and old name can't be same")
		}

		if (fs.existsSync(newPath)) {
			return reject(`File ${path.basename(newPath)} already exists`)
		}

		if (fs.existsSync(oldPath)) {
			return fs.rename(oldPath, newPath, err => {
				if (err) return reject(new Error(err))
				return resolve(
					`Renamed: ${path.basename(oldPath)} file to ${path.basename(
						newPath
					)}`
				)
			})
		}
		return reject(`File ${path.basename(oldPath)} already exists`)
	})
}

const upload = async args => {
	const files = await args.files
	const uploadAll = await Object.keys(files).map(async key => {
		const { createReadStream, filename } = await files[key]
		const stream = createReadStream()
		return new Promise((resolve, reject) => {
			return stream
				.on('error', error => {
					fs.unlink(`${args.path}/${filename}`, () => {
						reject(new Error(error))
					})
				})
				.pipe(fs.createWriteStream(`${args.path}/${filename}`))
				.on('error', error => reject(new Error(error)))
				.on('finish', () => {
					// Stage the file
					stageChanges(
						'add',
						repoDir(args.path),
						getRelFilePath(`${args.path}/${filename}`)
					).catch(error => reject(new Error(error)))

					// Commit the file
					const author = {
						name: 'placeholder',
						email: 'placeholder@example.com',
					}
					const committer = {
						name: 'placeholder',
						email: 'placeholder@example.com',
					}
					return gitCommit(
						args.path,
						author,
						committer,
						`Added: ${filename}`
					)
						.then(sha => {
							const fields = {
								name: filename,
								path: `${args.path}/${filename}`,
								commits: [sha],
							}

							// Add the file to db document
							return database
								.createFile(fields)
								.then(() => resolve())
								.catch(error => reject(new Error(error)))
						})
						.catch(error => reject(new Error(error)))
				})
		})
	})
	return Promise.all(uploadAll)
}

module.exports = {
	createFile,
	deleteFile,
	getFile,
	updateFile,
	renameFile,
	searchFiles,
	upload,
}
