const path = require('path')
const fs = require('fs')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const dailygit = require('../../functions')

const getFolderSize = require('../../utils/getFolderSize')
const { getRelFilePath, repoDir } = require('../../utils/parsePath')

const { PubSub } = require('apollo-server')
const pubsub = new PubSub()

const FILE_OPENED = 'FILE_OPENED'

const resolvers = {
	Subscription: {
		openFileSub: {
			subscribe: () => pubsub.asyncIterator([FILE_OPENED]),
		},
	},
	Query: {
		getNestedFolders: async (_, args) => {
			if (fs.existsSync(args.path)) {
				const data = await dailygit.folders
					.getNestedFolders(args.path)
					.then(response => response)
				const withParent = {
					name: path.parse(args.path).name,
					path: args.path,
					children: data,
				}
				return withParent
			}
			return new Error('ENOENT')
		},
		getFolderWithFiles: async (_, args) => {
			if (fs.existsSync(args.path)) {
				const data = await dailygit.folders
					.getFolderWithFiles(args.path)
					.then(response => response)
				const folderSize = await getFolderSize(args.path)
					.filter(Boolean)
					.map(file => fs.readFileSync(file))
					.join('\n')
				const withParent = {
					name: path.parse(args.path).name,
					type: 'folder',
					path: args.path,
					size: folderSize.length,
					children: data,
					createdAt: fs.statSync(args.path).birthtime,
				}
				return withParent
			}
			return new Error('ENOENT')
		},
		getFile: async (_, args) => {
			const stats = await fs.statSync(args.path)
			try {
				const fs = await dailygit.files.getFile(args.path)
				const db = await dailygit.database.readFile(args.path)

				const file = {
					name: path.basename(args.path),
					path: args.path,
					size: stats.size,
					createdAt: stats.birthtime,
					type: 'file',
					content: fs.toString(),
					commits: db.commits,
					lastSaved: db.lastSaved || '',
				}

				return file
			} catch (error) {
				return error
			}
		},
		openFile: (_, args) => {
			if (fs.existsSync(args.path)) {
				return dailygit.files
					.getFile(args.path)
					.then(success => {
						pubsub.publish(FILE_OPENED, { openFileSub: success })
						return success
					})
					.catch(failure => new Error(failure))
			}
			return new Error('ENOENT')
		},
		searchFiles: (_, args) =>
			dailygit.files
				.searchFiles(args.fileName)
				.then(data => data)
				.catch(e => e),
		getCommitLog: (_, { path: repoDir }) => {
			return git
				.log({
					dir: repoDir,
					depth: 10,
					ref: 'master',
				})
				.then(list => list)
				.catch(error => new Error(error))
		},
		getCommit: (_, { id, path: repoDir }) => {
			return git
				.readObject({
					dir: repoDir,
					oid: id,
				})
				.then(({ object }) => object)
				.catch(error => new Error(error))
		},
		getCommits: async (_, { path, commits }) => {
			const results = await commits.map(commit =>
				git
					.readObject({
						dir: path,
						oid: commit,
					})
					.then(({ object }) => object)
					.catch(error => new Error(error))
			)
			return Promise.all(results).then(data => data)
		},
		getCommitContent: (_, { id, path }) => {
			return git
				.readObject({
					dir: repoDir(path),
					oid: id,
					filepath: getRelFilePath(path),
					encoding: 'utf8',
				})
				.then(({ object }) => object)
				.catch(error => new Error(error))
		},
	},
}

module.exports = resolvers
