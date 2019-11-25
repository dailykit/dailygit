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
const { stageChanges, commitToBranch, gitCommit } = require('./git')

const createFile = async ({ path: givenPath, content }) => {
	try {
		// Check if entity folder exists
		if (!fs.existsSync(path.dirname(givenPath))) {
			return `Entity folder doesn't exist`
		}
		// Create the file
		await fs.writeFileSync(givenPath, JSON.stringify(content, null, 2))

		// Stage the file
		await stageChanges('add', repoDir(givenPath), getRelFilePath(givenPath))

		// Commit the file
		const author = {
			name: 'placeholder',
			email: 'placeholder@example.com',
		}
		const committer = {
			name: 'placeholder',
			email: 'placeholder@example.com',
		}
		const sha = await gitCommit(
			givenPath,
			author,
			committer,
			`Added: ${path.basename(givenPath)}`
		)

		// Add the file to db document
		const fields = {
			name: path.basename(givenPath),
			path: givenPath,
			commits: [sha],
		}
		await database.createFile(fields)

		return `Added: ${path.basename(givenPath)}`
	} catch (error) {
		return new Error(error)
	}
}

const deleteFile = async givenPath => {
	try {
		// Delete the file
		await fs.unlink(givenPath, err => {
			if (err) throw err
		})
		// Remove the file from the git index
		await stageChanges(
			'remove',
			repoDir(givenPath),
			getRelFilePath(givenPath)
		)

		// Commit the deleted file
		const author = {
			name: 'placeholder',
			email: 'placeholder@example.com',
		}
		const committer = {
			name: 'placeholder',
			email: 'placeholder@example.com',
		}
		await gitCommit(
			givenPath,
			author,
			committer,
			`Deleted: ${path.basename(givenPath)}`
		)
		await database.deleteFile(givenPath)
		return `Deleted: ${path.basename(givenPath)}`
	} catch (error) {
		return new Error(error)
	}
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

const updateFile = async args => {
	const { path: givenPath, data, commitMessage } = args
	return new Promise((resolve, reject) => {
		fs.writeFile(givenPath, data, async err => {
			if (err) return reject(new Error(err))

			try {
				// Add the updated file to staging
				await stageChanges(
					'add',
					repoDir(givenPath),
					getRelFilePath(givenPath)
				)

				// Commit the staged files
				const author = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}
				const committer = {
					name: 'placeholder',
					email: 'placeholder@example.com',
				}
				const sha = await gitCommit(
					givenPath,
					author,
					committer,
					commitMessage
				)
				await database.updateFile({
					commit: sha,
					path: givenPath,
				})
				resolve(`Updated: ${path.basename(givenPath)} file`)
			} catch (error) {
				reject(new Error(error))
			}
		})
	})
}

const updateFileInBranch = async ({ path: givenPath, branch }) => {
	try {
		const file = await database.readFile(givenPath)
		const { object } = await git.readObject({
			dir: repoDir(givenPath),
			oid: file.commits[0],
		})
		const author = {
			name: 'placeholder',
			email: 'placeholder@example.com',
		}
		const committer = {
			name: 'placeholder',
			email: 'placeholder@example.com',
		}
		const result = await commitToBranch(
			branch,
			file.commits[0],
			givenPath,
			author,
			committer,
			object.message
		)
		return result
	} catch (error) {
		return new Error(error)
	}
}

const draftFile = async args => {
	const { path: givenPath, data } = args
	return new Promise((resolve, reject) => {
		fs.writeFile(givenPath, data, async err => {
			if (err) return reject(new Error(err))
			return database
				.updateFile({ path: givenPath, lastSaved: Date.now() })
				.then(() =>
					resolve(`File ${path.basename(givenPath)} has been saved!`)
				)
		})
	})
}

const renameFile = async (oldPath, newPath) => {
	return new Promise((resolve, reject) => {
		// Check if newPath file exists
		if (oldPath === newPath) {
			return resolve("New name can't be the same old name!")
		} else if (fs.existsSync(newPath)) {
			return resolve('File already exists!')
		}

		// Rename File
		fs.rename(oldPath, newPath, async err => {
			if (err) return reject(new Error(err))

			// Remove the old file from git index
			stageChanges(
				'remove',
				repoDir(oldPath),
				getRelFilePath(oldPath)
			).catch(error => reject(new Error(error)))

			// Add the renamed file to staging
			stageChanges(
				'add',
				repoDir(oldPath),
				getRelFilePath(newPath)
			).catch(error => reject(new Error(error)))

			// Commit the staged files
			const author = {
				name: 'placeholder',
				email: 'placeholder@example.com',
			}
			const committer = {
				name: 'placeholder',
				email: 'placeholder@example.com',
			}
			return gitCommit(
				oldPath,
				author,
				committer,
				`Renamed: ${path.basename(oldPath)} file to ${path.basename(
					newPath
				)}`
			).then(sha =>
				database
					.updateFile({ commit: sha, path: oldPath, newPath })
					.then(() =>
						resolve(
							`Renamed: ${path.basename(
								oldPath
							)} file to ${path.basename(newPath)}`
						)
					)
					.catch(error => reject(new Error(error)))
			)
		})
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
	updateFileInBranch,
	renameFile,
	searchFiles,
	draftFile,
	upload,
}
