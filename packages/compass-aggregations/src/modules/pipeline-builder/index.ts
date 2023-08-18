import { combineReducers } from 'redux';
import aiPipeline from './pipeline-ai';
import stageEditor from './stage-editor';
import pipeline from './text-editor-pipeline';
import pipelineMode from './pipeline-mode';
import outputStage from './text-editor-output-stage';

const reducer = combineReducers({
  aiPipeline,
  pipelineMode,
  stageEditor,
  textEditor: combineReducers({
    pipeline,
    outputStage,
  }),
});

export default reducer;
