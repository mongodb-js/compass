import { combineReducers } from 'redux';
import stageEditor from './stage-editor';
import textEditor from './text-editor';
import pipelineMode from './pipeline-mode';

const reducer = combineReducers({
  pipelineMode,
  stageEditor,
  textEditor,
});

export default reducer;
