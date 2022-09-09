import React from 'react';
import { css } from '@mongodb-js/compass-components';

import WorkspaceContent from './workspace-content';
import type Namespace from '../types/namespace';
import {
  AppRegistryComponents,
  AppRegistryRoles,
  useAppRegistryComponent,
  useAppRegistryRole,
} from '../contexts/app-registry-context';

const homeViewStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  height: '100vh',
});

const homePageStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  flex: 1,
  overflow: 'auto',
  height: '100%',
  zIndex: 0,
});

const homePageContentStyles = css({
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: '600px',
  order: 2,
  overflowX: 'hidden',
});

export default function Workspace({
  namespace,
}: {
  namespace: Namespace;
}): React.ReactElement {
  const SidebarComponent = useAppRegistryComponent(
    AppRegistryComponents.SIDEBAR_COMPONENT
  );
  const globalModals = useAppRegistryRole(AppRegistryRoles.GLOBAL_MODAL);
  const GlobalShellComponent = useAppRegistryComponent(
    AppRegistryComponents.SHELL_COMPONENT
  );
  const findInPageRole = useAppRegistryRole(AppRegistryRoles.FIND_IN_PAGE);
  const FindInPage = findInPageRole ? findInPageRole[0].component : null;

  return (
    <div data-testid="home-view" className={homeViewStyles}>
      <div className={homePageStyles}>
        {SidebarComponent && <SidebarComponent />}
        <div className={homePageContentStyles}>
          <WorkspaceContent namespace={namespace} />
        </div>
        {FindInPage && <FindInPage />}
      </div>
      {globalModals &&
        globalModals.map((globalModal, index) => {
          const GlobalModal = globalModal.component;
          return <GlobalModal key={index} />;
        })}
      {GlobalShellComponent && <GlobalShellComponent />}
    </div>
  );
}
