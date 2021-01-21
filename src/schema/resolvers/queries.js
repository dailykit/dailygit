const path = require('path')
const fs = require('fs')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const dailygit = require('../../functions')

const getFolderSize = require('../../utils/getFolderSize')

const { getFilePaths } = require('../../utils/getFilePaths')
const { getRepoPath, getFilePath } = require('../../utils/parsePath')

const resolvers = {
   Subscription: {
      openFileSub: {
         subscribe: () => pubsub.asyncIterator([FILE_OPENED]),
      },
   },
   Query: {
      getNestedFolders: async (_, args, { root }) => {
         try {
            const data = await dailygit.folders.getNestedFolders(
               `${root}${args.path}`
            )
            const folders = {
               name: path.parse(args.path).name,
               path: `${root}${args.path}`,
               children: data,
            }
            return folders
         } catch (error) {
            return error
         }
      },
      getFolderWithFiles: async (_, args, { root }) => {
         try {
            const data = await dailygit.folders.getFolderWithFiles(
               `${root}${args.path}`
            )

            const folderSize = await getFolderSize(`${root}${args.path}`)
               .filter(Boolean)
               .map(file => fs.readFileSync(file))
               .join('\n')

            const folders = {
               name: path.basename(args.path),
               type: 'folder',
               path: `${root}${args.path}`,
               size: folderSize.length,
               children: data,
               createdAt: fs.statSync(`${root}${args.path}`).birthtime,
            }
            return folders
         } catch (error) {
            return error
         }
      },
      getFiles: async (_, args, { root }) => {
         try {
            const files = await getFilePaths(`${root}${args.path}`)
            const page = await files
               .slice(args.offset, args.limit + args.offset)
               .map(item => item.replace(new RegExp(root), ''))
            const result = await page.map(file =>
               resolvers.Query.getFile('', { path: file }, { root })
            )
            return result
         } catch (error) {
            return error
         }
      },
      getFile: async (_, args, { root }) => {
         const stats = await fs.statSync(`${root}${args.path}`)
         try {
            const fs = await dailygit.files.getFile(`${root}${args.path}`)
            const id = await dailygit.database.getFileId({ path: args.path })
            console.log(id)

            const file = {
               id,
               name: path.basename(args.path),
               path: args.path,
               size: stats.size,
               createdAt: stats.birthtime,
               type: 'file',
               content: fs.toString(),
               lastSaved: new Date().toISOString(),
            }

            return file
         } catch (error) {
            return error
         }
      },
      openFile: async (_, args, { root }) => {
         try {
            const file = await resolvers.Query.getFile(
               '',
               { path: args.path },
               { root }
            )
            return file
         } catch (error) {
            return error
         }
      },
      getCommitLog: async (_, args, { root }) => {
         try {
            const log = await git.log({
               dir: `${root}${args.path}`,
               depth: 10,
               ref: 'master',
            })
            return log
         } catch (error) {
            return error
         }
      },
      getCommit: async (_, { id, path }, { root }) => {
         try {
            const { object } = await git.readObject({
               dir: `${root}${path}`,
               oid: id,
            })
            return object
         } catch (error) {
            return error
         }
      },
      getCommits: async (_, { path, commits }, { root }) => {
         try {
            const results = await commits.map(async commit => {
               const { object } = await git.readObject({
                  dir: `${root}${path}`,
                  oid: commit,
               })
               return object
            })
            return results
         } catch (error) {
            return error
         }
      },
      getCommitContent: async (_, args, { root }) => {
         try {
            const { blob } = await git.readBlob({
               dir: `${root}${getRepoPath(args.path)}`,
               oid: args.id,
               filepath: getFilePath(args.path),
            })
            return blob.toString()
         } catch (error) {
            if (error.code === 'ReadObjectFail')
               return 'Failed to fetch commit content!'
            return error.message
         }
      },
   },
}

module.exports = resolvers
