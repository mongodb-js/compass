import { combineReducers } from 'redux';

import pipelineMode, {
  INITIAL_STATE as PIPELINE_MODE_INITIAL_STATE
} from './pipeline-mode';


export const INITIAL_STATE = {
  pipelineMode: PIPELINE_MODE_INITIAL_STATE,
};

const reducer = combineReducers({
  pipelineMode
});

export default reducer;
