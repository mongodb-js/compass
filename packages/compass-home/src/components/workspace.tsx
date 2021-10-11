/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import React, { useEffect } from 'react';

import WorkspaceContent from './workspace-content';
import Namespace from '../types/namespace';
import InstanceLoadedStatus from '../constants/instance-loaded-status';
import {
  AppRegistryComponents,
  AppRegistryRoles,
  useAppRegistryComponent,
  useAppRegistryRole,
} from '../contexts/app-registry-context';
import updateTitle from '../modules/update-title';

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
  appName,
  connectionTitle,
  instanceLoadingStatus,
  errorLoadingInstanceMessage,
  isDataLake,
  namespace,
}: {
  appName: string;
  connectionTitle: string;
  instanceLoadingStatus: InstanceLoadedStatus;
  errorLoadingInstanceMessage: string | null;
  isDataLake: boolean;
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

  useEffect(() => {
    updateTitle(appName, connectionTitle, namespace);
  });

  return (
    <div data-test-id="home-view" css={homeViewStyles}>
      <div css={homePageStyles}>
        <div css={homePageContentStyles}>
          <WorkspaceContent
            namespace={namespace}
            instanceLoadingStatus={instanceLoadingStatus}
            errorLoadingInstanceMessage={errorLoadingInstanceMessage}
            isDataLake={isDataLake}
          />
        </div>
        {SidebarComponent && <SidebarComponent />}
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
