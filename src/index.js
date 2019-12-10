const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const cors = require('cors')
const depthLimit = require('graphql-depth-limit')
const http = require('http')

// Import Schema
const schema = require('./schema/schema')

const PORT = 4000
const production = process.env.NODE_ENV === 'production' ? true : false
const apolloserver = new ApolloServer({
    schema,
    playground: {
        endpoint: `${
            production ? process.env.INST_URI : 'http://localhost:'
        }${PORT}/graphql`,
    },
    introspection: production ? false : true,
    validationRules: [depthLimit(11)],
    formatError: err => {
        if (err.message.includes('ENOENT'))
            return production
                ? new Error('No such folder or file exists!')
                : err
        return production ? new Error(err) : err
    },
    debug: production ? false : true,
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
