/* @flow */
import moment from 'moment'
import logger from '/utils/logger'
import Game from '/db/game/gameSchema'

const removeGames = () => {
  logger.info('MongoDB: remove ALL games from db')
  return Game.remove({})
}

// Save all games to db
const saveGames = async (games: Array<Object>) => {
  logger.info('MongoDB: Store games to DB')
  const gameDocs = []

  let attendance
  let minAttendance = 0
  let maxAttendance = 0

  const isInt = n => n % 1 === 0

  games.forEach(game => {
    const people = []

    // Combine date and time
    let date = moment.utc(game.date)
    const hours = game.time.substring(0, game.time.indexOf(':'))
    date = moment(date).add(hours, 'hours')

    // Parse min and max attendance number from string
    if (game.attendance) {
      attendance = game.attendance.replace(/\s/g, '').replace('–', '-')
      if (attendance.includes('-')) {
        minAttendance = attendance.substring(0, attendance.indexOf('-'))
        maxAttendance = attendance.substring(attendance.lastIndexOf('-') + 1)
      } else if (isInt(attendance)) {
        minAttendance = attendance
        maxAttendance = attendance
      } else {
        logger.error(
          `Game "${game.title}" has invalid attendance ${attendance}`
        )
      }
    } else {
      logger.error(`Game "${game.title}" is missing attendance`)
    }

    // Get names without Conbase ids
    game.people.forEach(person => {
      people.push(person.name)
    })

    const gameDoc = new Game({
      id: game.id,
      title: game.title,
      description: game.desc,
      notes: game.notes,
      location: game.loc[0],
      date,
      // time: game.time,
      mins: game.mins,
      tags: game.tags,
      people,
      minAttendance: minAttendance,
      maxAttendance: maxAttendance,
      attributes: game.attributes,
      table: game.table,
    })

    gameDocs.push(gameDoc)
  })

  // Remove existing documents
  try {
    await removeGames()
  } catch (error) {
    logger.error(`Error removing old db entries: ${error}`)
    return Promise.reject(error)
  }

  let response = null
  try {
    response = await Game.create(gameDocs)
    logger.info('MongoDB: Games saved to DB succesfully')
    return response
  } catch (error) {
    // TODO: Collect and return all errors, now only catches one
    logger.error(`Error saving game to db: ${error}`)
    return Promise.reject(error)
  }
}

const findGames = async () => {
  let response = null
  try {
    response = await Game.find({})
    logger.info(`MongoDB: Find all games`)
    return response
  } catch (error) {
    logger.error(`MongoDB: Error fetcing games - ${error}`)
    return error
  }
}

const game = { saveGames, findGames, removeGames }

export default game
