import { EMPTY_STAGE } from '../constants';
import { ObjectId } from 'bson';
import { generateStage } from 'modules/stage';
import isString from 'lodash.isstring';

export const generateStageWithDefaults = (props = {}) => {
  return {
    ...EMPTY_STAGE,
    id: new ObjectId().toHexString(),
    ...props
  };
};

/**
 * Parse out a namespace from the stage.
 *
 * @param {String} currentDb - The current database.
 * @param {String} stage - The stage.
 *
 * @returns {String} The namespace.
 */
export const parseNamespace = (currentDb, stage) => {
  const s = generateStage(stage);
  const merge = s.$merge;
  if (isString(merge)) {
    return `${currentDb}.${merge}`;
  }
  const into = merge.into;
  if (isString(into)) {
    return `${currentDb}.${into}`;
  }
  return `${into.db || currentDb}.${into.coll}`;
};
