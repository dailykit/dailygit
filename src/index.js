require('dotenv').config()

const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const cors = require('cors')
const depthLimit = require('graphql-depth-limit')
const http = require('http')

// Import Schema
const schema = require('./schema/schema')

const PORT = process.env.PORT || 4000
const isProd = process.env.NODE_ENV === 'production' ? true : false

const server = new ApolloServer({
   schema,
   playground: {
      endpoint: `${process.env.ENDPOINT}/graphql`,
   },
   introspection: isProd ? false : true,
   validationRules: [depthLimit(11)],
   formatError: err => {
      if (err.message.includes('ENOENT'))
         return isProd ? new Error('No such folder or file exists!') : err
      return isProd ? new Error(err) : err
   },
   debug: isProd ? false : true,
   context: {
      root: process.env.FS_PATH,
      media: process.env.MEDIA_PATH,
   },
})

const app = express()

server.applyMiddleware({ app })

app.use(cors({ origin: '*' }))

app.listen({port: PORT}, () => {
   console.log(
      '🚀 Server ready at',
      `http://localhost:${PORT}${server.graphqlPath}`
   )
})
