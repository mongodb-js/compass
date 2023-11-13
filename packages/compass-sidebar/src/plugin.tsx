import React from 'react';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import {
  ErrorBoundary,
  css,
  defaultSidebarWidth,
} from '@mongodb-js/compass-components';

import Sidebar from './components/sidebar';

const { log, mongoLogId } = createLoggerAndTelemetry(
  'mongodb-compass:compass-sidebar:plugin'
);

const errorBoundaryStyles = css({
  width: defaultSidebarWidth,
});

function SidebarPlugin() {
  return (
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
      <Sidebar />
    </ErrorBoundary>
  );
}

SidebarPlugin.displayName = 'SidebarPlugin';

export default SidebarPlugin;
