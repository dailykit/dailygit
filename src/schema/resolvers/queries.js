const path = require('path')
const fs = require('fs')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const dailygit = require('../../functions')

const getFolderSize = require('../../utils/getFolderSize')
const { getRelFilePath, repoDir, getAppName } = require('../../utils/parsePath')

const getFilePaths = require('../../utils/getFilePaths')

const { PubSub } = require('graphql-subscriptions')
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
            try {
                const data = await dailygit.folders.getNestedFolders(args.path)
                const folders = {
                    name: path.parse(args.path).name,
                    path: args.path,
                    children: data,
                }
                return folders
            } catch (error) {
                return error
            }
        },
        getFolderWithFiles: async (_, args) => {
            try {
                const data = await dailygit.folders.getFolderWithFiles(
                    args.path
                )

                const folderSize = await getFolderSize(args.path)
                    .filter(Boolean)
                    .map(file => fs.readFileSync(file))
                    .join('\n')

                const folders = {
                    name: path.basename(args.path),
                    type: 'folder',
                    path: args.path,
                    size: folderSize.length,
                    children: data,
                    createdAt: fs.statSync(args.path).birthtime,
                }
                return folders
            } catch (error) {
                return error
            }
        },
        getFiles: async (_, args) => {
            try {
                const files = await getFilePaths(args.path)
                const page = await files.slice(
                    args.offset,
                    args.limit + args.offset
                )
                const result = await page.map(
                    async file =>
                        await resolvers.Query.getFile('', {
                            path: file,
                        })
                )
                return result
            } catch (error) {
                return error
            }
        },
        getFile: async (_, args) => {
            const stats = await fs.statSync(args.path)
            try {
                const fs = await dailygit.files.getFile(args.path)
                const db = await dailygit.database.readFile(
                    { path: args.path },
                    getAppName(args.path)
                )

                const file = {
                    id: db._id,
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
        openFile: async (_, args) => {
            try {
                const file = await resolvers.Query.getFile('', {
                    path: args.path,
                })
                await pubsub.publish(FILE_OPENED, { openFileSub: file })
                return file
            } catch (error) {
                return error
            }
        },
        searchFiles: async (_, args) => {
            try {
                const files = await dailygit.files.searchFiles(args.fileName)
                return files
            } catch (error) {
                return error
            }
        },
        getCommitLog: async (_, { path: repoDir }) => {
            try {
                const log = await git.log({
                    dir: repoDir,
                    depth: 10,
                    ref: 'master',
                })
                return log
            } catch (error) {
                return error
            }
        },
        getCommit: async (_, { id, path: repoDir }) => {
            try {
                const { object } = await git.readObject({
                    dir: repoDir,
                    oid: id,
                })
                return object
            } catch (error) {
                return error
            }
        },
        getCommits: async (_, { path, commits }) => {
            try {
                const results = await commits.map(async commit => {
                    const { object } = await git.readObject({
                        dir: path,
                        oid: commit,
                    })
                    return object
                })
                return results
            } catch (error) {
                return error
            }
        },
        getCommitContent: async (_, args) => {
            try {
                const { object } = await git.readObject({
                    dir: repoDir(args.path),
                    oid: args.id,
                    filepath: getRelFilePath(args.path),
                    encoding: 'utf8',
                })
                return object
            } catch (error) {
                return error
            }
        },
    },
}

module.exports = resolvers
