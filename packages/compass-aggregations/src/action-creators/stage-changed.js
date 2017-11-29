/**
 * Stage changed action.
 */
const STAGE_CHANGED = 'STAGE_CHANGED';

/**
 * Action creator for stage changed events.
 *
 * @param {String} value - The stage text value.
 * @param {Number} index - The index of the stage.
 *
 * @returns {Object} The stage changed action.
 */
const stageChanged = (value, index) => {
  return {
    type: STAGE_CHANGED,
    index: index,
    stage: value
  };
};

export { stageChanged, STAGE_CHANGED };
