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

const apolloserver = new ApolloServer({
   schema,
   playground: {
      endpoint: `${process.env.ENDPOINT}:${PORT}/graphql`,
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

apolloserver.applyMiddleware({ app })

const httpServer = http.createServer(app)
apolloserver.installSubscriptionHandlers(httpServer)

app.use(cors({ origin: '*' }))

httpServer.listen(PORT, () => {
   console.log(
      '🚀 Server ready at',
      `http://localhost:${PORT}${apolloserver.graphqlPath}`
   )
   console.log(
      '🚀 Subscriptions ready at',
      `ws://localhost:${PORT}${apolloserver.subscriptionsPath}`
   )
})
