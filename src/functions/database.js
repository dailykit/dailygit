const mongoose = require('mongoose')
const path = require('path')

const fileSchema = require('../models/File')

const App = require('../models/App')

const { getRepoName } = require('../utils/parsePath')

const connectToDB = dbName => {
	return new Promise((resolve, reject) => {
		return mongoose
			.connect(`mongodb://localhost:27017/${dbName}`, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				useFindAndModify: false,
				useCreateIndex: true,
			})
			.then(() => resolve('Connected to MongoDB!'))
			.catch(error => reject(new Error(error)))
	})
}

// Create file document
const createFile = (fields, db) => {
	return new Promise((resolve, reject) => {
		// Connect to database
		return connectToDB(db)
			.then(() => {
				const repoName = getRepoName(fields.path)
				const Model = mongoose.model(repoName, fileSchema)

				Model.findOne({ path: fields.path }, (error, result) => {
					if (result)
						return reject(`File: ${fields.name} already exists!`)

					const file = new Model(fields)

					// Save file as document
					return file.save(error => {
						if (error) return reject(new Error(error))
						return resolve(`File ${fields.name} has been saved!`)
					})
				})
			})
			.catch(error => reject(new Error(error)))
	})
}

const deleteFile = (filePath, db) => {
	return new Promise((resolve, reject) => {
		// Connect to database
		return connectToDB(db)
			.then(() => {
				const repoName = getRepoName(filePath)

				// Create Model
				const Model = mongoose.model(repoName, fileSchema)

				// Find file doc by path
				Model.findOne({ path: filePath }, (error, file) => {
					if (error)
						return reject(
							`File: ${path.basename(filePath)} doesn't exists!`
						)
					// Delete file doc using Id
					return Model.findByIdAndDelete(file.id, error => {
						if (error) return reject(new Error(error))
						return resolve(
							`File ${path.basename(filePath)} has been deleted!`
						)
					})
				})
			})
			.catch(error => reject(new Error(error)))
	})
}

const updateFile = (fields, db) => {
	return new Promise((resolve, reject) => {
		// Connect to database
		return connectToDB(db)
			.then(() => {
				const repoName = getRepoName(fields.path)

				// Create Model
				const Model = mongoose.model(repoName, fileSchema)

				// Find file doc by path
				Model.findOne({ path: fields.path }, (error, file) => {
					if (error) return reject(new Error(error))
					const data = {
						...(fields.newPath && {
							name: path.basename(fields.newPath),
						}),
						...(fields.path && {
							path: fields.newPath ? fields.newPath : fields.path,
						}),
						...(fields.commit && {
							commits: [fields.commit, ...file.commits],
						}),
						...(fields.lastSaved && {
							lastSaved: fields.lastSaved,
						}),
						...(fields.content && {
							content: fields.content,
						}),
						updatedAt: Date.now(),
					}
					return Model.findByIdAndUpdate(
						file.id,
						{ $set: data },
						{ new: true },
						error => {
							if (error) return reject(new Error(error))
							return resolve(
								`File ${path.basename(
									fields.newPath
										? fields.newPath
										: fields.path
								)} has been updated!`
							)
						}
					)
				})
			})
			.catch(error => reject(new Error(error)))
	})
}

const readFile = ({ path }, db) => {
	return new Promise((resolve, reject) => {
		// Connect to database
		return connectToDB(db)
			.then(() => {
				const repoName = getRepoName(path)

				// Create Model
				const Model = mongoose.model(repoName, fileSchema)

				// Find file doc by path
				const query = {
					path,
				}
				Model.findOne(query, (error, file) => {
					if (error) return reject(new Error(error))
					return resolve(file)
				})
			})
			.catch(error => reject(new Error(error)))
	})
}

const fileExists = ({ path: filePath }, db) => {
	return new Promise((resolve, reject) => {
		// Connect to database
		return connectToDB(db)
			.then(() => {
				const repoName = getRepoName(filePath)

				// Create Model
				const Model = mongoose.model(repoName, fileSchema)

				// Find file doc by path
				const query = {
					path: filePath,
				}
				Model.findOne(query, (error, file) => {
					if (error) return resolve(false)
					return resolve(file)
				})
			})
			.catch(error => reject(new Error(error)))
	})
}

const createApp = ({ name, entities, staging }) => {
	return new Promise((resolve, reject) => {
		return connectToDB('apps').then(() => {
			const app = new App({
				name: name,
				dependents: [],
				status: 'active',
				...(entities && { entities: entities }),
				...(staging && { staging }),
			})

			// Save file as document
			return app.save((error, result) => {
				if (error) return reject(new Error(error))
				return resolve(result)
			})
		})
	})
}

const updateApp = (apps, appID) => {
	return new Promise((resolve, reject) => {
		return connectToDB('apps').then(() => {
			apps.map(app => {
				App.findOne({ name: app.name }, (error, doc) => {
					if (error) return reject(new Error(error))
					App.findByIdAndUpdate(
						{ _id: doc.id },
						{ $push: { dependents: appID } },
						{ new: true },
						(error, doc) => {
							if (error) return reject(new Error(error))
							return resolve(doc)
						}
					)
				})
			})
		})
	})
}

const readApp = name => {
	return new Promise((resolve, reject) => {
		return connectToDB('apps').then(() => {
			App.findOne({ name })
				.populate('dependents')
				.exec((error, doc) => {
					if (error) return reject(new Error(error))
					return resolve(doc)
				})
		})
	})
}

module.exports = {
	createFile,
	deleteFile,
	updateFile,
	readFile,
	createApp,
	updateApp,
	readApp,
	fileExists,
}
