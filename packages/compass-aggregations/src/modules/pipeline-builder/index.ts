import { combineReducers } from 'redux';
import stageEditor from './stage-editor';

import pipelineMode from './pipeline-mode';

const reducer = combineReducers({
  pipelineMode,
  stageEditor
});

export default reducer;
