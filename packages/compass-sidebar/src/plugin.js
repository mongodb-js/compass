import React from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';

import Sidebar from './components/sidebar';
import store from './stores';


/**
 * Connect the Plugin to the store and render.
 *
 * @returns {React.Component} The rendered component.
 */
function SidebarPlugin({
  connectionInfo,
  updateAndSaveConnectionInfo
}) {
  return (
    <Provider store={store}>
      <Sidebar
        connectionInfo={connectionInfo}
        updateConnectionInfo={updateAndSaveConnectionInfo}
      />
    </Provider>
  );
}

SidebarPlugin.displayName = 'SidebarPlugin';
SidebarPlugin.propTypes = {
  connectionInfo: PropTypes.object.isRequired,
  updateAndSaveConnectionInfo: PropTypes.func.isRequired
};


export default SidebarPlugin;
