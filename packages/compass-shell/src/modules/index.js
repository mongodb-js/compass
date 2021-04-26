import { combineReducers } from 'redux';
import appRegistry from 'mongodb-redux-common/app-registry';

import infoModal from './info-modal';
import runtime from './runtime';

const reducer = combineReducers({
  appRegistry,
  infoModal,
  runtime
});

export default reducer;
