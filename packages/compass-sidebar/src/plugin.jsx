import React from 'react';
import { Provider } from 'react-redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import {
  ErrorBoundary,
  css,
  defaultSidebarWidth,
} from '@mongodb-js/compass-components';

import Sidebar from './components/sidebar';
import LegacySidebar from './components-legacy/sidebar';

import store from './stores';

const { log, mongoLogId } = createLoggerAndTelemetry(
  'mongodb-compass:compass-sidebar:plugin'
);

const errorBoundaryStyles = css({
  width: defaultSidebarWidth,
});

/**
 * Connect the Plugin to the store and render.
 *
 * @returns {React.Component} The rendered component.
 */
function SidebarPlugin() {
  const useNewSidebar = process?.env?.COMPASS_SHOW_NEW_SIDEBAR === 'true';

  return (
    <Provider store={store}>
      <ErrorBoundary
        className={errorBoundaryStyles}
        displayName="Sidebar"
        onError={(error, errorInfo) => {
          log.error(
            mongoLogId(1001000148),
            'Sidebar',
            'Rendering sidebar failed',
            { error: error.message, errorInfo }
          );
        }}
      >
        {useNewSidebar ? <Sidebar /> : <LegacySidebar />}
      </ErrorBoundary>
    </Provider>
  );
}

SidebarPlugin.displayName = 'SidebarPlugin';

export default SidebarPlugin;
