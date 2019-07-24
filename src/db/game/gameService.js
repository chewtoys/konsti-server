/* @flow */
import _ from 'lodash'
import { logger } from 'utils/logger'
import { Game } from 'db/game/gameSchema'
import { db } from 'db/mongodb'
import type { KompassiGame } from 'flow/game.flow'

const removeGames = async (): Promise<any> => {
  logger.info('MongoDB: remove ALL games from db')
  try {
    return await Game.deleteMany({})
  } catch (error) {
    logger.error(`MongoDB: Error removing games - ${error}`)
    return error
  }
}

const removeDeletedGames = async (
  games: $ReadOnlyArray<KompassiGame>
): Promise<any> => {
  const currentGames = await findGames()

  const formattedGames = games.map(game => {
    // For testing
    // if (game.identifier === 'p3646') return {}

    return {
      gameId: game.identifier,
      title: game.title,
      description: game.description,
      location: game.room_name,
      startTime: game.start_time,
      mins: game.length,
      tags: game.tags,
      genres: game.genres,
      styles: game.styles,
      language: game.language,
      endTime: game.end_time,
      people: game.formatted_hosts,
      minAttendance: game.min_players,
      maxAttendance: game.max_players,
      gameSystem: game.rpg_system,
      englishOk: game.english_ok,
      childrenFriendly: game.children_friendly,
      ageRestricted: game.age_restricted,
      beginnerFriendly: game.beginner_friendly,
      intendedForExperiencedParticipants:
        game.intended_for_experienced_participants,
      shortDescription: game.short_blurb,
      revolvingDoor: game.revolving_door,
    }
  })

  const deletedGames = _.differenceBy(currentGames, formattedGames, 'gameId')

  if (deletedGames && deletedGames.length !== 0) {
    logger.info(`Found ${deletedGames.length} deleted games, remove...`)

    try {
      await Promise.all(
        deletedGames.map(async deletedGame => {
          await Game.deleteOne({ gameId: deletedGame.gameId })
        })
      )
    } catch (error) {
      logger.error(`Error removing deleted games: ${error}`)
      return Promise.reject(error)
    }

    await removeDeletedGamesFromUsers()
  }
}

const removeDeletedGamesFromUsers = async () => {
  logger.info('Remove deleted games from users')

  let users = null
  try {
    users = await db.user.findUsers()
  } catch (error) {
    logger.error(`findUsers error: ${error}`)
    return Promise.reject(error)
  }

  try {
    await Promise.all(
      users.map(async user => {
        const signedGames = user.signedGames.filter(signedGame => {
          return signedGame.gameDetails
        })

        const enteredGames = user.enteredGames.filter(enteredGame => {
          return enteredGame.gameDetails
        })

        const favoritedGames = user.favoritedGames.filter(favoritedGame => {
          return favoritedGame
        })

        if (
          user.signedGames.length !== signedGames.length ||
          user.enteredGames.length !== enteredGames.length ||
          user.favoritedGames.length !== favoritedGames.length
        ) {
          await db.user.updateUser({
            ...user,
            signedGames,
            enteredGames,
            favoritedGames,
          })
        }
      })
    )
  } catch (error) {
    logger.error(`db.user.updateUser error: ${error}`)
    throw new Error('No assign results')
  }
}

const saveGames = async (games: $ReadOnlyArray<KompassiGame>): Promise<any> => {
  logger.info('MongoDB: Store games to DB')

  try {
    await Promise.all(
      games.map(async game => {
        await Game.updateOne(
          { gameId: game.identifier },
          {
            gameId: game.identifier,
            title: game.title,
            description: game.description,
            location: game.room_name,
            startTime: game.start_time,
            mins: game.length,
            tags: game.tags,
            genres: game.genres,
            styles: game.styles,
            language: game.language,
            endTime: game.end_time,
            people: game.formatted_hosts,
            minAttendance: game.min_players,
            maxAttendance: game.max_players,
            gameSystem: game.rpg_system,
            englishOk: game.english_ok,
            childrenFriendly: game.children_friendly,
            ageRestricted: game.age_restricted,
            beginnerFriendly: game.beginner_friendly,
            intendedForExperiencedParticipants:
              game.intended_for_experienced_participants,
            shortDescription: game.short_blurb,
            revolvingDoor: game.revolving_door,
          },
          {
            upsert: true,
            setDefaultsOnInsert: true,
          }
        )
      })
    )
  } catch (error) {
    logger.error(`Error saving games to db: ${error}`)
    return Promise.reject(error)
  }

  await removeDeletedGames(games)

  logger.info('MongoDB: Games saved to DB succesfully')
  return findGames()
}

const findGames = async (): Promise<any> => {
  let response = null
  try {
    response = await Game.find({}).lean()
    logger.debug(`MongoDB: Find all games`)
    return response
  } catch (error) {
    logger.error(`MongoDB: Error fetcing games - ${error}`)
    return error
  }
}

const saveGamePopularity = async (
  gameId: string,
  popularity: number
): Promise<any> => {
  logger.debug(`MongoDB: Update game ${gameId} popularity to ${popularity}`)
  try {
    return await Game.updateOne(
      {
        gameId,
      },
      {
        popularity,
      }
    )
  } catch (error) {
    logger.errog(`Error updating game popularity: ${error}`)
  }
}

export const game = { saveGames, findGames, removeGames, saveGamePopularity }
