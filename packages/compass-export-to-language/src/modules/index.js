import { combineReducers } from 'redux';
import appRegistry, {
  INITIAL_STATE as APP_REGISTRY_STATE,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import builders, { INITIAL_STATE as BUILDERS_INITIAL_STATE } from './builders';
import copySuccess, {
  INITIAL_STATE as COPY_SUCCESS_INITIAL_STATE,
} from './copy-success';
import copyToClipboard, {
  INITIAL_STATE as CTCFC_INITIAL_STATE,
} from './copy-to-clipboard';
import driver, { INITIAL_STATE as DRIVER_INITIAL_STATE } from './driver';
import imports, { INITIAL_STATE as IMPORTS_INITIAL_STATE } from './imports';
import inputExpression, {
  INITIAL_STATE as INPUT_EXPRESSION_INITIAL_STATE,
} from './input-expression';
import modalOpen, { INITIAL_STATE as MODAL_INITIAL_STATE } from './modal-open';
import mode, { INITIAL_STATE as MODE_INITIAL_STATE } from './mode';
import outputLang, {
  INITIAL_STATE as OUTPUT_LANG_INITIAL_STATE,
} from './output-lang';
import error, { INITIAL_STATE as ERROR_INITIAL_STATE } from './error';
import transpiledExpression, {
  INITIAL_STATE as TRANSPILED_EXPRESSION_INITIAL_STATE,
} from './transpiled-expression';
import showImports, {
  INITIAL_STATE as SHOW_IMPORTS_INITIAL_STATE,
} from './show-imports';
import uri, { INITIAL_STATE as URI_INITIAL_STATE } from './uri';
import namespace, { INITIAL_STATE as NS_INITIAL_STATE } from './namespace';

export const INITIAL_STATE = {
  builders: BUILDERS_INITIAL_STATE,
  copySuccess: COPY_SUCCESS_INITIAL_STATE,
  copyToClipboard: CTCFC_INITIAL_STATE,
  driver: DRIVER_INITIAL_STATE,
  imports: IMPORTS_INITIAL_STATE,
  inputExpression: INPUT_EXPRESSION_INITIAL_STATE,
  modalOpen: MODAL_INITIAL_STATE,
  mode: MODE_INITIAL_STATE,
  outputLang: OUTPUT_LANG_INITIAL_STATE,
  error: ERROR_INITIAL_STATE,
  transpiledExpression: TRANSPILED_EXPRESSION_INITIAL_STATE,
  showImports: SHOW_IMPORTS_INITIAL_STATE,
  uri: URI_INITIAL_STATE,
  namespace: NS_INITIAL_STATE,
  appRegistry: APP_REGISTRY_STATE,
};

/**
 * The reducer.
 */
const reducer = combineReducers({
  builders,
  copySuccess,
  copyToClipboard,
  driver,
  imports,
  inputExpression,
  modalOpen,
  mode,
  outputLang,
  error,
  transpiledExpression,
  showImports,
  uri,
  namespace,
  appRegistry,
});

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state, action) => {
  return reducer(state, action);
};

export default rootReducer;
