const path = require('path')
const fs = require('fs')

const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const dailygit = require('../../functions')

const {
   addDataFolders,
   addExtendedSchemaFiles,
   addSchemaFolders,
} = require('../../utils/installApp')

const { repoDir, getRelFilePath, getAppName } = require('../../utils/parsePath')

const { getFilePaths } = require('../../utils/getFilePaths')

const resolvers = {
   Mutation: {
      installApp: async (_, args, { root }) => {
         // Add the app to installed list in DB
         const options = {
            name: args.name,
            ...(args.schemas && {
               entities: JSON.parse(args.schemas).schemas.map(
                  schema => schema.path
               ),
            }),
            ...(args.staging && { staging: true }),
         }

         const docId = await dailygit.database
            .createApp(options)
            .then(result => result.id)

         const appPath = `${root}${args.name}`
         const dataFolders = []
         const schemaFolders = []
         const { schemas } = args.schemas
            ? JSON.parse(args.schemas)
            : { schemas: [] }
         const { apps } = args.apps ? JSON.parse(args.apps) : { apps: [] }

         // For both independent & hybrid
         if (schemas.length > 0) {
            // Add Schema, Data Folder Paths
            await schemas.map(folder => {
               schemaFolders.push(`${appPath}/schema/${folder.path}`)
               dataFolders.push(`${appPath}/data/${folder.path}`)
            })
         }

         // Hybrid App
         if (schemas.length > 0 && apps.length > 0) {
            try {
               // Update the deps of extended app.
               await dailygit.database.updateApp(apps, docId)

               // Create data folders and initialize git
               await addDataFolders(dataFolders)

               // Create Folders with Schema Entity Files
               await addSchemaFolders(schemaFolders, schemas, appPath)

               // Create Extendend Schema File
               await addExtendedSchemaFiles(apps, args.name)

               return {
                  success: true,
                  message: `App ${args.name} is installed!`,
               }
            } catch (error) {
               return {
                  success: false,
                  error: `App ${args.name} did not install correctly!`,
               }
            }
         }
         // Independent App
         if (schemas.length > 0 && apps.length === 0) {
            try {
               // Create data folders and initialize git
               await addDataFolders(dataFolders)

               // Create Folders with Schema Entity Files
               await addSchemaFolders(schemaFolders, schemas, appPath)

               return {
                  success: true,
                  message: `App ${args.name} is installed!`,
               }
            } catch (error) {
               return {
                  success: false,
                  error: `App ${args.name} did not install correctly!`,
               }
            }
         }
         // Dependent App
         if (schemas.length === 0 && apps.length > 0) {
            try {
               // Update the deps of extended app.
               await dailygit.database.updateApp(apps, docId)

               // Create Extendend Schema File
               await addExtendedSchemaFiles(apps, args.name)

               return {
                  success: true,
                  message: `App ${args.name} is installed!`,
               }
            } catch (error) {
               return {
                  success: false,
                  error: `App ${args.name} did not install correctly!`,
               }
            }
         }
      },
      createFolder: async (_, args, { root }) => {
         try {
            await dailygit.folders.createFolder(`${root}${args.path}`)
            return {
               success: true,
               message: `Folder: ${path.basename(args.path)} has been created!`,
            }
         } catch (error) {
            return {
               success: false,
               error,
            }
         }
      },
      deleteFolder: async (_, args, { root }) => {
         const filepaths = await getFilePaths(`${root}${args.path}`).then(
            paths => {
               return paths.map(path => path.replace(new RegExp(root), ''))
            }
         )
         try {
            // File System
            await dailygit.folders.deleteFolder(`${root}${args.path}`)

            const author = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const committer = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const repoPath = path =>
               `${root}${path
                  .split('/')
                  .slice(0, 3)
                  .join('/')}`
            const filePath = path =>
               `${path
                  .split('/')
                  .slice(3)
                  .join('/')}`

            await filepaths.map(async filepath => {
               // Git
               await dailygit.git.removeAndCommit(
                  {
                     repoPath: repoPath(filepath),
                     filePath: filePath(filepath),
                  },
                  author,
                  committer,
                  `Deleted: File ${path.basename(filepath)}`
               )

               // Database
               await dailygit.database.deleteFile(filepath)
            })

            await filepaths.map(async filepath => {
               const { dependents } = await dailygit.database.readApp(
                  filepath.split('/')[0]
               )

               await dependents.map(async dependent => {
                  try {
                     const exists = await dailygit.database.fileExists(
                        filepath,
                        dependent.name
                     )
                     if (exists) {
                        return await dailygit.database.deleteFile(
                           filepath,
                           dependent.name
                        )
                     }
                     return
                  } catch (error) {
                     throw error
                  }
               })
            })

            return {
               success: true,
               message: `Folder: ${path.basename(args.path)} has been deleted!`,
            }
         } catch (error) {
            return {
               success: false,
               error,
            }
         }
      },
      renameFolder: async (_, args, { root }) => {
         try {
            const oldFiles = await getFilePaths(`${root}${args.oldPath}`).then(
               paths => {
                  return paths.map(path => path.replace(new RegExp(root), ''))
               }
            )

            // File System
            await dailygit.folders.renameFolder(
               `${root}${args.oldPath}`,
               `${root}${args.newPath}`
            )

            // Git
            const newFiles = await getFilePaths(`${root}${args.newPath}`).then(
               paths => {
                  return paths.map(path => path.replace(new RegExp(root), ''))
               }
            )
            const author = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const committer = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const repoPath = path =>
               `${root}${path
                  .split('/')
                  .slice(0, 3)
                  .join('/')}`
            const filePath = path =>
               `${path
                  .split('/')
                  .slice(3)
                  .join('/')}`

            await oldFiles.map(filepath => {
               return git.remove({
                  dir: repoPath(filepath),
                  filepath: filePath(filepath),
               })
            })

            await newFiles.map(async filepath => {
               try {
                  const sha = await dailygit.git.addAndCommit(
                     {
                        repoPath: repoPath(filepath),
                        filePath: filePath(filepath),
                     },
                     author,
                     committer,
                     `Moved: ${path.basename(filepath)} from ${path.basename(
                        args.oldPath
                     )} to ${path.basename(args.newPath)}`
                  )

                  // Database
                  await dailygit.database.updateFile({
                     commit: sha,
                     path: oldFiles[newFiles.indexOf(filepath)],
                     newPath: filepath,
                  })

                  const { dependents } = await dailygit.database.readApp(
                     args.oldPath.split('/')[0]
                  )

                  await dependents.map(async dependent => {
                     try {
                        const file = await dailygit.database.fileExists(
                           oldFiles[newFiles.indexOf(filepath)]
                        )
                        if (file) {
                           return await dailygit.database.updateFile(
                              {
                                 commit: sha,
                                 path: oldFiles[newFiles.indexOf(filepath)],
                                 newPath: filepath,
                              },
                              dependent.name
                           )
                        }
                        return
                     } catch (error) {
                        throw error
                     }
                  })
               } catch (error) {
                  throw error
               }
            })

            return {
               success: true,
               message: `Folder ${path.basename(
                  args.oldPath
               )} renamed to ${path.basename(args.newPath)}`,
            }
         } catch (error) {
            return {
               success: false,
               error,
            }
         }
      },
      createFile: async (_, args, { root }) => {
         try {
            // Filesystem
            await dailygit.files.createFile(`${root}${args.path}`, args.content)

            // Git
            const author = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const committer = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const repoPath = `${root}${args.path
               .split('/')
               .slice(0, 3)
               .join('/')}`
            const filePath = `${args.path
               .split('/')
               .slice(3)
               .join('/')}`
            const sha = await dailygit.git.addAndCommit(
               { repoPath, filePath },
               author,
               committer,
               `Added: ${path.basename(args.path)}`
            )

            // Database
            await dailygit.database.createFile({
               name: path.basename(args.path),
               path: args.path,
               commits: [sha],
            })

            return {
               success: true,
               message: `File ${path.basename(args.path)} has been created`,
            }
         } catch (error) {
            return {
               success: false,
               error,
            }
         }
      },
      deleteFile: async (_, args, { root }) => {
         try {
            // Filesystem
            await dailygit.files.deleteFile(`${root}${args.path}`)

            // Git
            const author = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const committer = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const repoPath = `${root}${args.path
               .split('/')
               .slice(0, 3)
               .join('/')}`
            const filePath = `${args.path
               .split('/')
               .slice(3)
               .join('/')}`
            await dailygit.git.removeAndCommit(
               { repoPath, filePath },
               author,
               committer
            )
            // Database
            await dailygit.database.deleteFile(args.path)

            const { dependents } = await dailygit.database.readApp(
               args.path.split('/')[0]
            )

            await dependents.map(async dependent => {
               try {
                  const file = await dailygit.database.fileExists(args.path)
                  if (file) {
                     return await dailygit.database.deleteFile(args.path)
                  }
                  return
               } catch (error) {
                  throw error
               }
            })

            return {
               success: true,
               message: `File ${path.basename(args.path)} has been deleted`,
            }
         } catch (error) {
            return {
               success: false,
               error,
            }
         }
      },
      updateFile: async (_, args, { root }) => {
         try {
            // File System
            await dailygit.files.updateFile(`${root}${args.path}`, args.content)

            // Git
            const author = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const committer = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const repoPath = `${root}${args.path
               .split('/')
               .slice(0, 3)
               .join('/')}`
            const filePath = `${args.path
               .split('/')
               .slice(3)
               .join('/')}`
            const sha = await dailygit.git.addAndCommit(
               { repoPath, filePath },
               author,
               committer,
               args.message
            )

            // Database
            await dailygit.database.updateFile({
               commit: sha,
               path: args.path,
            })

            // Update dependents if any
            const { dependents } = await dailygit.database.readApp(
               args.path.split('/')[0]
            )
            await dependents.map(async dependent => {
               try {
                  const exists = await dailygit.database.fileExists(args.path)

                  if (exists) {
                     return await dailygit.database.updateFile({
                        commit: sha,
                        path: args.path,
                        ...(dependent.staging && {
                           content: args.content,
                        }),
                     })
                  } else {
                     const mainFile = await dailygit.database.readFile(
                        args.path
                     )
                     return await dailygit.database.createFile({
                        name: mainFile.name,
                        path: mainFile.path,
                        commits: mainFile.commits,
                        ...(dependent.staging && {
                           content: args.content,
                        }),
                     })
                  }
               } catch (error) {
                  throw error
               }
            })

            return {
               success: true,
               message: `File: ${path.basename(args.path)} has been updated!`,
            }
         } catch (error) {
            return {
               success: false,
               error,
            }
         }
      },
      draftFile: async (_, args, { root }) => {
         try {
            // File System
            await dailygit.files.updateFile(`${root}${args.path}`, args.content)

            // Database
            await dailygit.database.updateFile({
               path: args.path,
               lastSaved: Date.now(),
            })
            return {
               success: true,
               message: `File: ${path.basename(args.path)} has been updated!`,
            }
         } catch (error) {
            return {
               success: false,
               error,
            }
         }
      },
      renameFile: async (_, args, { root }) => {
         try {
            // File System
            await dailygit.files.renameFile(
               `${root}${args.oldPath}`,
               `${root}${args.newPath}`
            )

            // Git
            const author = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const committer = {
               name: 'placeholder',
               email: 'placeholder@example.com',
            }
            const repoPath = path =>
               `${root}${path
                  .split('/')
                  .slice(0, 3)
                  .join('/')}`
            const filePath = path =>
               `${path
                  .split('/')
                  .slice(3)
                  .join('/')}`

            await git.remove({
               dir: repoPath(args.oldPath),
               filepath: filePath(args.oldPath),
            })

            const sha = await dailygit.git.addAndCommit(
               {
                  repoPath: repoPath(args.newPath),
                  filePath: filePath(args.newPath),
               },
               author,
               committer,
               `Renamed: ${path.basename(args.oldPath)} file to ${path.basename(
                  args.newPath
               )}`
            )

            // Database
            await dailygit.database.updateFile({
               commit: sha,
               path: args.oldPath,
               newPath: args.newPath,
            })

            const { dependents } = await dailygit.database.readApp(
               args.oldPath.split('/')[0]
            )

            await dependents.map(async dependent => {
               try {
                  const file = await dailygit.database.fileExists(args.oldPath)
                  if (file) {
                     return await dailygit.database.updateFile({
                        commit: sha,
                        path: args.oldPath,
                        newPath: args.newPath,
                     })
                  }
                  return
               } catch (error) {
                  throw error
               }
            })

            return {
               success: true,
               message: `File: ${path.basename(
                  args.oldPath
               )} renamed to ${path.basename(args.newPath)}`,
            }
         } catch (error) {
            return {
               success: false,
               error,
            }
         }
      },
      imageUpload: async (_, args, { media }) => {
         try {
            const { files } = await args

            await Object.keys(files).map(async key => {
               // File System
               const file = await files[key]
               await dailygit.files.upload(`${media}`, file)
            })
            return {
               success: true,
               message: `${files.length} file${
                  files.length > 1 ? 's' : ''
               } has been uploaded`,
            }
         } catch (error) {
            return {
               success: false,
               error,
            }
         }
      },
   },
}

module.exports = resolvers
