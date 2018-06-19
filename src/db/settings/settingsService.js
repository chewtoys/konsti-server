/* @flow */
import moment from 'moment'
import { logger } from '../../utils/logger'
import Settings from './settingsSchema'

const removeSettings = () => {
  logger.info('MongoDB: remove ALL settings from db')
  return Settings.remove({})
}

const createSettings = async () => {
  logger.info('MongoDB: "Settings" collection not found, create empty')

  const settings = new Settings({
    blacklistedGames: [],
    canceledGames: [],
    signupTime: moment.utc('2000-01-01'),
  })

  let response = null
  try {
    response = await settings.save()
    logger.info(`MongoDB: Empty settings collection saved to DB`)
    return response
  } catch (error) {
    logger.error(`MongoDB: Error creating empty settings collection - ${error}`)
    return error
  }
}

const findSettings = async () => {
  let response = null
  try {
    response = await Settings.findOne({})
  } catch (error) {
    logger.error(`MongoDB: Error finding settings data - ${error}`)
    return error
  }

  if (response === null) {
    // No settings data, create new collection
    return createSettings()
  }
  logger.info(`MongoDB: Settings data found`)
  return response
}

const saveBlacklist = async (blacklistData: Object) => {
  let response = null
  try {
    response = await Settings.update({
      $set: { blacklistedGames: blacklistData.blacklistedGames },
    })
    logger.info(`MongoDB: Blacklist data updated`)
    return response
  } catch (error) {
    logger.error(`MongoDB: Error updating blacklist data - ${error}`)
    return error
  }
}

const saveSignupTime = async (signupTime: Date) => {
  // Make sure that the string is in correct format
  let formattedTime
  if (signupTime === null) {
    formattedTime = moment.utc('2000-01-01')
  } else {
    formattedTime = moment.utc(signupTime)
  }

  let response = null
  try {
    response = await Settings.update({
      $set: { signupTime: formattedTime },
    })
    logger.info(`MongoDB: Signup time updated`)
    return response
  } catch (error) {
    logger.error(`MongoDB: Error updating signup time - ${error}`)
    return error
  }
}

const settings = {
  findSettings,
  removeSettings,
  saveBlacklist,
  saveSignupTime,
}

export default settings
