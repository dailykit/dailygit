const graphql = require('graphql');
const { GraphQLObjectType, GraphQLString, GraphQLSchema } = graphql

let filesystem = require('../filesystem');

const FileSystemType = new GraphQLObjectType({
  name: 'FileSystem',
  fields: () => ({
    id: { type: GraphQLString },
  }),
});

const FileType = new GraphQLObjectType({
  name: 'File',
  fields: () => ({
    response: { type: GraphQLString }
  }),
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    loadfiles: {
      type: FileSystemType,
      args: { id: { type: GraphQLString } },
      resolve(parent, args) {
        return { id: 'Hello World' };
      },
    },

    getFile: {
      type: FileType,
      args: { file: { type: GraphQLString }},
      resolve(parent, args) {
        return filesystem.getFile(args.file).then((result) => {
          return { response: result };
        });
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
});
