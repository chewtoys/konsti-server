/* @flow */
import logger from '/utils/logger'
import getRandomInt from '/player-assignment/utils/getRandomInt'
import type { User } from '/flow/user.flow'
import type { Game } from '/flow/game.flow'

type UserArray = Array<User>
type SignedGame = { id: string, priority: number }
type SignupResult = {
  username: string,
  enteredGame: { id: string },
  signedGames: Array<SignedGame>,
}

const runAssignment = (
  playerGroups: Array<UserArray>,
  selectedGames: Array<Game>
): { score: number, signupResults: Array<SignupResult> } => {
  const signupResults = []
  let matchingGroups = []
  let selectedGroups = []
  let score = 0

  for (let selectedGame of selectedGames) {
    for (let playerGroup of playerGroups) {
      // Get groups with specific game signup
      // Always use first player in group
      playerGroup[0].signedGames.forEach(signedGame => {
        if (signedGame.id === selectedGame.id) {
          matchingGroups.push(playerGroup)
        }
      })
    }

    // Number of matching players
    const playersCount = matchingGroups.reduce(
      (acc, matchingGroup) => acc + matchingGroup.length,
      0
    )

    logger.debug(
      `Found ${
        matchingGroups.length
      } groups with ${playersCount} players for game "${selectedGame.title}", ${
        selectedGame.minAttendance
      }-${selectedGame.maxAttendance} players required`
    )

    // Not enough interested players, game will not happen
    if (playersCount < selectedGame.minAttendance) {
      logger.debug(
        `Not enough players for game "${
          selectedGame.title
        }" (signed: ${playersCount}, required: ${selectedGame.minAttendance}-${
          selectedGame.maxAttendance
        })`
      )
      break
    }

    // Maximum number of players is either game's limit or number of interested players
    const maximumPlayers = Math.min(selectedGame.maxAttendance, playersCount)

    let numberOfPlayers = 0
    let counter = 0
    const counterLimit = 10

    while (numberOfPlayers < maximumPlayers) {
      // Randomize group to enter the game
      let groupNumber = getRandomInt(0, matchingGroups.length - 1)
      const selectedGroup = matchingGroups[groupNumber]

      if (selectedGroup.length === 1) {
        logger.debug(`Selected player: ${selectedGroup[0].username} `)
      } else {
        logger.debug(
          `Selected group ${selectedGroup[0].playerGroup} with ${
            selectedGroup.length
          } players`
        )
      }

      // Enough seats remaining for the game
      if (numberOfPlayers + selectedGroup.length <= maximumPlayers) {
        numberOfPlayers += selectedGroup.length

        // Store results for selected groups members
        for (let groupMember of selectedGroup) {
          score += 1
          signupResults.push({
            username: groupMember.username,
            enteredGame: { id: selectedGame.id },
            signedGames: groupMember.signedGames,
          })
        }

        selectedGroups.push(selectedGroup)

        // Remove selected group from MATCHING groups array
        matchingGroups = matchingGroups.filter(
          remainingGroup =>
            remainingGroup[0].username !== selectedGroup[0].username
        )

        const seatsRemaining = maximumPlayers - numberOfPlayers
        logger.debug(`Seats remaining: ${seatsRemaining}`)
      }
      // Not enought seats remaining for the game
      else {
        counter += 1
        logger.debug(`No match, increase counter: ${counter}/${counterLimit}`)
        if (counter >= counterLimit) {
          logger.debug(`Limit reached, stop loop`)
          break
        }
      }
    }

    // Check if game has enough signups
    if (numberOfPlayers < selectedGame.minAttendance) {
      logger.debug(
        `Not enough signups for game "${
          selectedGame.title
        }" (signed: ${playersCount}, assigned: ${numberOfPlayers}, required: ${
          selectedGame.minAttendance
        }-${selectedGame.maxAttendance})`
      )
    }
    // Game will happen, remove selected groups from ALL groups array
    else {
      playerGroups = playerGroups.filter(remainingGroup => {
        for (let selectedGroup of selectedGroups) {
          if (remainingGroup[0].username === selectedGroup[0].username) {
            return undefined
          }
        }
        return remainingGroup
      })
    }

    logger.debug(`${playerGroups.length} player groups remaining`)

    // Clear selections
    matchingGroups = []
    selectedGroups = []

    logger.debug(`**************`)
  }

  return {
    score,
    signupResults,
  }
}

export default runAssignment