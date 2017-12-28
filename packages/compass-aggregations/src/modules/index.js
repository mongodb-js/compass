import { combineReducers } from 'redux';

import namespace from './namespace';
import fields from './fields';
import serverVersion from './server-version';
import stages from './stages';
import view from './view';

export default combineReducers({
  namespace,
  fields,
  serverVersion,
  stages,
  view
});
