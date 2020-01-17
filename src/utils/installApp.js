const fs = require('fs')
const git = require('isomorphic-git')
git.plugins.set('fs', fs)

const dailygit = require('../functions')

const addDataFolders = folders => {
   return folders.map(path =>
      dailygit.folders
         .createFolder(path)
         .then(() => git.init({ dir: path }))
         .catch(error => ({
            success: false,
            error: new Error(error),
         }))
   )
}

const addSchemaFolders = async (folders, schema, appPath) => {
   const folderPath = (folderName, folderPath) =>
      `${appPath}/${folderName}/${folderPath}`

   await folders.map(async path => {
      try {
         await dailygit.folders.createFolder(path)
         await schema.map(folder => {
            return folder.entities.map(file => {
               const filepath = `${folderPath('schema', folder.path)}/${
                  file.name
               }.json`
               return fs.writeFile(
                  filepath,
                  JSON.stringify(file.content, null, 2),
                  error => {
                     if (error) throw error
                  }
               )
            })
         })
      } catch (error) {
         return {
            success: false,
            error: new Error(error),
         }
      }
   })
}

const addExtendedSchemaFiles = (apps, name, root) => {
   return apps.map(app => {
      return app.entities.map(entity => {
         const path = `${root}${app.name}/schema/${entity.name}/ext.${name}.json`
         return fs.writeFile(
            path,
            JSON.stringify(entity.schema, null, 2),
            error => {
               if (error) throw error
            }
         )
      })
   })
}

module.exports = {
   addDataFolders,
   addSchemaFolders,
   addExtendedSchemaFiles,
}
