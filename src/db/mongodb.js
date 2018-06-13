const mongoose = require('mongoose')
const { logger } = require('../utils/logger')
const config = require('../../config')

const user = require('./user/userController')
const feedback = require('./feedback/feedbackController')
const game = require('./game/gameController')
const results = require('./results/resultsController')
const settings = require('./settings/settingsController')

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

module.exports = {
  connectToDb,
  user,
  feedback,
  game,
  results,
  settings,
}
