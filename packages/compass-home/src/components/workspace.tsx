import React from 'react';
import { css } from '@mongodb-js/compass-components';

import WorkspaceContent from './workspace-content';
import type Namespace from '../types/namespace';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { CompassSidebarPlugin } from '@mongodb-js/compass-sidebar';
import { CompassShellPlugin } from '@mongodb-js/compass-shell';

const verticalSplitStyles = css({
  width: '100vw',
  height: '100vh',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridTemplateRows: 'auto min-content',
  overflow: 'hidden',
});

const horizontalSplitStyles = css({
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'min-content auto',
  minHeight: 0,
});

const homePageContentStyles = css({
  minHeight: 0,
  overflow: 'hidden',
});

const sidebarStyles = css({
  minHeight: 0,
});

const shellContainerStyles = css({
  zIndex: 5,
});

export default function Workspace({
  namespace,
  connectionInfo,
}: {
  namespace: Namespace;
  connectionInfo: ConnectionInfo | null | undefined;
}): React.ReactElement {
  return (
    <>
      <div data-testid="home-view" className={verticalSplitStyles}>
        <div className={horizontalSplitStyles}>
          <div className={sidebarStyles}>
            <CompassSidebarPlugin connectionInfo={connectionInfo} />
          </div>
          <div className={homePageContentStyles}>
            <WorkspaceContent namespace={namespace} />
          </div>
        </div>
        <div className={shellContainerStyles}>
          <CompassShellPlugin />
        </div>
      </div>
    </>
  );
}
