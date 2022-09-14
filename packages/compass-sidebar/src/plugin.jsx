import React from 'react';
import { Provider } from 'react-redux';

import Sidebar from './components/sidebar';
import LegacySidebar from './components-legacy/sidebar';

import store from './stores';

/**
 * Connect the Plugin to the store and render.
 *
 * @returns {React.Component} The rendered component.
 */
function SidebarPlugin() {
  const useNewSidebar = process?.env?.COMPASS_SHOW_NEW_SIDEBAR !== 'false';

  return (
    <Provider store={store}>
      {useNewSidebar ? <Sidebar /> : <LegacySidebar />}
    </Provider>
  );
}

SidebarPlugin.displayName = 'SidebarPlugin';

export default SidebarPlugin;
