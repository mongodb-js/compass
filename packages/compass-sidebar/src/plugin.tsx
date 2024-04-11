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

const errorBoundaryStyles = css({
  width: defaultSidebarWidth,
});

export interface SidebarPluginProps {
  showConnectionInfo?: boolean;
  // TODO(COMPASS-7397): the need for passing this directly to sidebar should go
  // away with refactoring compoass-conneciton to a plugin
  initialConnectionInfo?: ConnectionInfo | null | undefined;
}

const SidebarPlugin: React.FunctionComponent<SidebarPluginProps> = ({
  showConnectionInfo,
}) => {
  const isMultiConnectionEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );

  const activeWorkspace = useActiveWorkspace();
  const { log, mongoLogId } = useLoggerAndTelemetry('COMPASS-SIDEBAR-UI');

  const sidebar = isMultiConnectionEnabled ? (
    <MultipleConnectionSidebar activeWorkspace={activeWorkspace} />
  ) : (
    <Sidebar
      showConnectionInfo={showConnectionInfo}
      activeWorkspace={activeWorkspace}
    />
  );

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
