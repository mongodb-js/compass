import React from 'react';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import {
  ErrorBoundary,
  css,
  defaultSidebarWidth,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useActiveWorkspace } from '@mongodb-js/compass-workspaces/provider';
import Sidebar from './components/legacy/sidebar';
import { usePreference } from 'compass-preferences-model/provider';
import MultipleConnectionSidebar from './components/multiple-connections/sidebar';
import { ConnectionInfoProvider } from '@mongodb-js/compass-connections/provider';

const errorBoundaryStyles = css({
  width: defaultSidebarWidth,
});

export interface SidebarPluginProps {
  showConnectionInfo?: boolean;
  singleConnectionConnectionInfo?: ConnectionInfo;
}

const SidebarPlugin: React.FunctionComponent<SidebarPluginProps> = ({
  showConnectionInfo,
  // TODO(COMPASS-7397): the need for passing this directly to sidebar should go
  // away with refactoring compass-connection to a plugin
  singleConnectionConnectionInfo,
}) => {
  const isMultiConnectionEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );

  const activeWorkspace = useActiveWorkspace();
  const { log, mongoLogId } = useLoggerAndTelemetry('COMPASS-SIDEBAR-UI');

  let sidebar;
  if (isMultiConnectionEnabled) {
    sidebar = <MultipleConnectionSidebar activeWorkspace={activeWorkspace} />;
  } else {
    sidebar = (
      <ConnectionInfoProvider
        connectionInfoId={singleConnectionConnectionInfo?.id}
      >
        {(connectionInfo) => {
          return (
            <Sidebar
              showConnectionInfo={showConnectionInfo}
              initialConnectionInfo={connectionInfo}
              activeWorkspace={activeWorkspace}
            />
          );
        }}
      </ConnectionInfoProvider>
    );
  }

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
      {sidebar}
    </ErrorBoundary>
  );
};

export default SidebarPlugin;
