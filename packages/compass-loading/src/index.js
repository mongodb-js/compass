import LoadingPlugin from './plugin';
import configureStore, { CHANGE_STATUS } from 'stores';

/**
 * Activate all the components in the Aggregations package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
const activate = () => {
};

/**
 * Deactivate all the components in the Aggregations package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
const deactivate = () => {
};

export default LoadingPlugin;
export { configureStore, CHANGE_STATUS, activate, deactivate };
