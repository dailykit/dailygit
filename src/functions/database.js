const { GraphQLClient, gql } = require('graphql-request')
const nodePath = require('path')
const graphQLClient = new GraphQLClient(process.env.DATA_HUB_URI, {
   headers: {
      'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET,
   },
})
const createMutation = gql`
   mutation INSERT_FILE($object: editor_file_insert_input!) {
      insert_editor_file_one(object: $object) {
         id
      }
   }
`
const createFileRecord = async path => {
   try {
      const variables = {
         object: {
            fileType: nodePath.basename(path).split('.').pop(),
            fileName: nodePath.basename(path),
            path: path,
            lastSaved: new Date().toISOString(),
         },
      }
      console.log(variables)

      const data = await graphQLClient.request(createMutation, variables)
      return data.insert_editor_file_one.id
   } catch (err) {
      console.error(err)
   }
}

const updateRecordedFile = async ({ path, lastSaved }) => {
   const mutation = gql`
      mutation UPDATE_FILE($path: String!, $set: editor_file_set_input!) {
         update_editor_file(where: { path: { _eq: $path } }, _set: $set) {
            returning {
               id
               path
            }
         }
      }
   `
   const variables = {
      path,
      set: {
         lastSaved,
      },
   }

   const data = await graphQLClient.request(mutation, variables)
   return console.log(JSON.stringify(data, undefined, 2))
}

const renameRecordedFile = async ({
   oldFilePath,
   fileName,
   newFilePath,
   lastSaved,
}) => {
   const mutation = gql`
      mutation RENAME_FILE($path: String!, $set: editor_file_set_input!) {
         update_editor_file(where: { path: { _eq: $path } }, _set: $set) {
            returning {
               id
               path
            }
         }
      }
   `
   const variables = {
      path: oldFilePath,
      set: {
         fileName: fileName,
         path: newFilePath,
         lastSaved,
      },
   }

   const data = await graphQLClient.request(mutation, variables)
   return console.log(JSON.stringify(data, undefined, 2))
}

const deleteRecordedFile = async ({ path }) => {
   const mutation = gql`
      mutation DELETE_RECORD($path: String!) {
         delete_editor_file(where: { path: { _eq: $path } }) {
            returning {
               id
               path
            }
         }
      }
   `
   const variables = {
      path,
   }

   const data = await graphQLClient.request(mutation, variables)
   return console.log(JSON.stringify(data, undefined, 2))
}

const getFileId = async ({ path }) => {
   const query = gql`
      query getFileId($path: String!) {
         editor_file(where: { path: { _eq: $path } }) {
            id
         }
      }
   `
   const variables = {
      path,
   }

   const data = await graphQLClient
      .request(query, variables)
      .catch(error => console.error(error))
   if (
      // if fileId exist then return the file id
      Object.keys(data).length &&
      data.editor_file.length &&
      data.editor_file[0].id
   ) {
      return data.editor_file[0].id
   } else {
      // if fileId not exist save the file in datahub and then return the fileId
      const id = await createFileRecord({
         fileType: nodePath.basename(path).split('.').pop(),
         fileName: nodePath.basename(path),
         path,
         lastSaved: new Date().toISOString(),
      })
      return id
   }
}

module.exports = {
   createFileRecord,
   getFileId,
   updateRecordedFile,
   deleteRecordedFile,
   renameRecordedFile,
}
