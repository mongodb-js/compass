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
  onOpenConnectViaModal?: (
    atlasMetadata: ConnectionInfo['atlasMetadata']
  ) => void;
  isCompassWeb?: boolean;
}

const SidebarPlugin: React.FunctionComponent<SidebarPluginProps> = ({
  onOpenConnectViaModal,
  isCompassWeb,
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
        activeWorkspace={activeWorkspace}
        onOpenConnectViaModal={onOpenConnectViaModal}
        isCompassWeb={isCompassWeb}
      />
    </ErrorBoundary>
  );
};

export default SidebarPlugin;
