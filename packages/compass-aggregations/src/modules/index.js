import { combineReducers } from 'redux';

import serverVersion from './server-version';
import stages from './stages';

export default combineReducers({
  serverVersion,
  stages
});
