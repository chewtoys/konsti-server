const moment = require('moment')
const { logger } = require('../../utils/logger')
const Results = require('./resultsSchema')

const removeResults = () => {
  logger.info('MongoDB: remove ALL results from db')
  return Results.remove({})
}
const getResults = async () => {
  let response = null
  try {
    response = await Results.find({})
    logger.info(`MongoDB: Results data found`)
    return response
  } catch (error) {
    logger.error(`MongoDB: Error finding results data - ${error}`)
    return error
  }
}

const saveAllSignupResults = async (signupResultData, startingTime) => {
  const formattedTime = moment.utc(startingTime)

  const results = new Results({
    result: signupResultData,
    time: formattedTime,
  })

  let response = null
  try {
    response = await results.save()
    logger.info(`MongoDB: Signup results stored to separate collection`)
    return response
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup results to separate collection - ${error}`
    )
    return error
  }
}

module.exports = {
  removeResults,
  saveAllSignupResults,
  getResults,
}