/* @flow */
import mongoose from 'mongoose'
import { logger } from '../utils/logger'
import config from '../config'

import user from './user/userService'
import feedback from './feedback/feedbackService'
import game from './game/gameService'
import results from './results/resultsService'
import settings from './settings/settingsService'

const connectToDb = async () => {
  // Use native Node promises
  mongoose.Promise = global.Promise

  // Connect to MongoDB and create/use database
  try {
    await mongoose.connect(config.db)
    logger.info('MongoDB: Connection succesful')
  } catch (error) {
    logger.error(`MongoDB: Error connecting to DB: ${error}`)
    process.exit()
  }
}

const gracefulExit = () => {
  mongoose.connection.close(() => {
    logger.info(`MongoDB: ${config.db} is disconnected through app termination`)
    process.exit()
  })
}

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', gracefulExit)
process.on('SIGTERM', gracefulExit)

const db = {
  connectToDb,
  user,
  feedback,
  game,
  results,
  settings,
}

export default db
