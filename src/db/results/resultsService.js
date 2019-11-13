// @flow
import { logger } from 'utils/logger';
import { ResultsModel } from 'db/results/resultsSchema';
import type { Result, ResultsCollectionEntry } from 'flow/result.flow';

const removeResults = () => {
  logger.info('MongoDB: remove ALL results from db');
  return ResultsModel.deleteMany({});
};

const findResult = async (
  startTime: string
): Promise<ResultsCollectionEntry> => {
  let response = null;
  try {
    response = await ResultsModel.findOne(
      { startTime },
      '-_id -__v -createdAt -updatedAt -result._id'
    )
      .lean()
      .sort({ createdAt: -1 })
      .populate('results.enteredGame.gameDetails');
    logger.debug(`MongoDB: Results data found for time ${startTime}`);
  } catch (error) {
    throw new Error(
      `MongoDB: Error finding results data for time ${startTime} - ${error}`
    );
  }

  return response;
};

const saveResult = async (
  signupResultData: $ReadOnlyArray<Result>,
  startTime: string,
  algorithm: string,
  message: string
): Promise<ResultsCollectionEntry> => {
  const results = signupResultData.map(result => {
    return {
      username: result.username,
      enteredGame: {
        gameDetails: result.enteredGame.gameDetails._id,
        priority: result.enteredGame.priority,
        time: result.enteredGame.time,
      },
    };
  });

  let response = null;
  try {
    response = await ResultsModel.replaceOne(
      { startTime },
      { startTime, results, algorithm, message },
      { upsert: true }
    );
    logger.debug(
      `MongoDB: Signup results for starting time ${startTime} stored to separate collection`
    );
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup results for starting time ${startTime} to separate collection - ${error}`
    );
    return error;
  }

  return response;
};

export const results = { removeResults, saveResult, findResult };
