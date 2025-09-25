import 'reflect-metadata' // We need this in order to use @Decorators
import 'module-alias/register'

import config from './config'

import express from 'express'

import Logger from './loaders/logger'
import { createServer } from 'http'

async function startServer() {
  const app = express()
  const httpServer = createServer(app)

  /**
   * A little hack here
   * Import/Export can only be used in 'top-level code'
   * Well, at least in node 10 without babel and at the time of writing
   * So we are using good old require.
   **/
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  await require('./loaders').default({ expressApp: app, httpServer })

  process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
    // application specific logging, throwing an error, or other logic here
  })

  httpServer
    .listen(config.port, () => {
      Logger.info(`
      ################################################
      🛡️  Server listening on port: ${config.port} 🛡️
      ################################################
    `)
    })
    .on('error', (err) => {
      Logger.error(err)
      process.exit(1)
    })
}

startServer()
