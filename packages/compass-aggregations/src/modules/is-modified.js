import { CLONE_PIPELINE } from './clone-pipeline';
import { NEW_PIPELINE } from './import-pipeline';
import { StageEditorActionTypes } from './pipeline-builder/stage-editor';
import { EditorActionTypes } from './pipeline-builder/text-editor-pipeline';
import { SAVED_PIPELINE_ADD } from './saved-pipeline';

/**
 * Reducer function for handle state changes to isModified.
 *
 * @param {Boolean} state - The isModified state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = false, action) {
  if (
    [
      StageEditorActionTypes.StageAdded,
      StageEditorActionTypes.StageMoved,
      StageEditorActionTypes.StageDisabledChange,
      StageEditorActionTypes.StageOperatorChange,
      StageEditorActionTypes.StageRemoved,
      StageEditorActionTypes.StageValueChange,
      EditorActionTypes.EditorValueChange,
    ].includes(action.type)
  ) {
    return true;
  }
  if (
    action.type === CLONE_PIPELINE ||
    action.type === NEW_PIPELINE ||
    action.type === SAVED_PIPELINE_ADD
  ) {
    return false;
  }
  return state;
}
