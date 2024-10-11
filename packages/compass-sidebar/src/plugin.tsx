import React from 'react';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import {
  ErrorBoundary,
  css,
  defaultSidebarWidth,
} from '@mongodb-js/compass-components';
import { useActiveWorkspace } from '@mongodb-js/compass-workspaces/provider';
import MultipleConnectionSidebar from './components/multiple-connections/sidebar';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';

const errorBoundaryStyles = css({
  width: defaultSidebarWidth,
});

export interface SidebarPluginProps {
  showSidebarHeader?: boolean;
  onOpenConnectViaModal?: (
    atlasMetadata: ConnectionInfo['atlasMetadata']
  ) => void;
}

const SidebarPlugin: React.FunctionComponent<SidebarPluginProps> = ({
  showSidebarHeader,
  onOpenConnectViaModal,
}) => {
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
      <MultipleConnectionSidebar
        showSidebarHeader={showSidebarHeader}
        activeWorkspace={activeWorkspace}
        onOpenConnectViaModal={onOpenConnectViaModal}
      />
    </ErrorBoundary>
  );
};

export default SidebarPlugin;
