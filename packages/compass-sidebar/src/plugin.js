import React from 'react';
import { Provider } from 'react-redux';

import Sidebar from './components/sidebar';
import store from './stores';


/**
 * Connect the Plugin to the store and render.
 *
 * @returns {React.Component} The rendered component.
 */
function SidebarPlugin() {
  return (
    <Provider store={store}>
      <Sidebar />
    </Provider>
  );
}

SidebarPlugin.displayName = 'SidebarPlugin';

export default SidebarPlugin;
