import React from 'react';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import {
  ErrorBoundary,
  css,
  defaultSidebarWidth,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import Sidebar from './components/sidebar';

const { log, mongoLogId } = createLoggerAndTelemetry(
  'mongodb-compass:compass-sidebar:plugin'
);

const errorBoundaryStyles = css({
  width: defaultSidebarWidth,
});

export interface SidebarPluginProps {
  activeWorkspace: { type: string; namespace?: string } | null;
  // TODO(COMPASS-7397): the need for passing this directly to sidebar should go
  // away with refactoring compoass-conneciton to a plugin
  initialConnectionInfo?: ConnectionInfo | null | undefined;
}

function SidebarPlugin({ activeWorkspace }: SidebarPluginProps) {
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
      <Sidebar activeWorkspace={activeWorkspace} />
    </ErrorBoundary>
  );
}

SidebarPlugin.displayName = 'SidebarPlugin';

export default SidebarPlugin;
