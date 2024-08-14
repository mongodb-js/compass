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
import { useSingleConnectionModeConnectionInfoStatus } from '@mongodb-js/compass-connections/provider';

const errorBoundaryStyles = css({
  width: defaultSidebarWidth,
});

export interface SidebarPluginProps {
  showConnectionInfo?: boolean;
}

const SidebarPlugin: React.FunctionComponent<SidebarPluginProps> = ({
  showConnectionInfo,
}) => {
  const isMultiConnectionEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );
  const { connectionInfo } = useSingleConnectionModeConnectionInfoStatus();

  const activeWorkspace = useActiveWorkspace();
  const { log, mongoLogId } = useLogger('COMPASS-SIDEBAR-UI');

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
      {isMultiConnectionEnabled && (
        <MultipleConnectionSidebar activeWorkspace={activeWorkspace} />
      )}
      {!isMultiConnectionEnabled && connectionInfo && (
        <Sidebar
          showConnectionInfo={showConnectionInfo}
          activeWorkspace={activeWorkspace}
        />
      )}
    </ErrorBoundary>
  );
};

export default SidebarPlugin;
