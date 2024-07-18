import React from 'react';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import {
  ErrorBoundary,
  css,
  defaultSidebarWidth,
} from '@mongodb-js/compass-components';
import { useActiveWorkspace } from '@mongodb-js/compass-workspaces/provider';
import Sidebar from './components/legacy/sidebar';
import { usePreference } from 'compass-preferences-model/provider';
import MultipleConnectionSidebar from './components/multiple-connections/sidebar';
import {
  ConnectionInfoProvider,
  useActiveConnections,
} from '@mongodb-js/compass-connections/provider';

const errorBoundaryStyles = css({
  width: defaultSidebarWidth,
});

export interface SidebarPluginProps {
  showConnectionInfo?: boolean;
}

const SidebarPlugin: React.FunctionComponent<SidebarPluginProps> = ({
  showConnectionInfo,
}) => {
  const [activeConnection] = useActiveConnections();
  const isMultiConnectionEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );

  const activeWorkspace = useActiveWorkspace();
  const { log, mongoLogId } = useLogger('COMPASS-SIDEBAR-UI');

  let sidebar;
  if (isMultiConnectionEnabled) {
    sidebar = <MultipleConnectionSidebar activeWorkspace={activeWorkspace} />;
  } else {
    sidebar = (
      <ConnectionInfoProvider connectionInfoId={activeConnection?.id}>
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
