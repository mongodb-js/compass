import { combineReducers } from 'redux';

import stages from './stages';
import serverVersion from './server-version';

export default combineReducers({
  stages,
  serverVersion
});
