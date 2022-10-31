import { combineReducers } from 'redux';
import stageEditor from './stage-editor';
import textEditor from './text-editor';
import pipelineMode from './pipeline-mode';
import outputStage from './text-editor-output-stage';

const reducer = combineReducers({
  pipelineMode,
  stageEditor,
  textEditor,
  outputStage,
});

export default reducer;
