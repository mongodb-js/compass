import { combineReducers } from 'redux';

import namespace from './namespace';
import serverVersion from './server-version';
import stages from './stages';

export default combineReducers({
  namespace,
  serverVersion,
  stages
});
