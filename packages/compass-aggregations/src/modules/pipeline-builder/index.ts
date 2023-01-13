import { combineReducers } from 'redux';
import stageEditor from './stage-editor';
import pipeline from './text-editor-pipeline';
import pipelineMode from './pipeline-mode';
import outputStage from './text-editor-output-stage';

const reducer = combineReducers({
  pipelineMode,
  stageEditor,
  textEditor: combineReducers({
    pipeline,
    outputStage,
  })
});

export default reducer;
