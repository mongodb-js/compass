/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import React, { useRef } from 'react';
import debugModule from 'debug';
import AppRegistry from 'hadron-app-registry';

import WorkspaceContent from './workspace-content';
import Namespace from '../types/namespace';
import InstanceLoadedStatus from '../constants/instance-loaded-status';
import getRoleOrNull from '../modules/get-role-or-null';

const debug = debugModule('mongodb-compass:home:WorkspaceComponent');

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

function getComponentOrNull(appRegistry: AppRegistry, name: string) {
  const component = appRegistry.getComponent(name);
  if (!component) debug(`home plugin loading component, but ${name} is NULL`);
  return component ? component : null;
}

export default function Workspace({
  appRegistry,
  instanceLoadingStatus,
  errorLoadingInstanceMessage,
  isDataLake,
  namespace,
}: {
  appRegistry: AppRegistry;
  instanceLoadingStatus: InstanceLoadedStatus;
  errorLoadingInstanceMessage: string | null;
  isDataLake: boolean;
  namespace: Namespace;
}): React.ReactElement {
  const SidebarComponent = useRef(
    getComponentOrNull(appRegistry, 'Sidebar.Component')
  );
  const globalModals = useRef(getRoleOrNull(appRegistry, 'Global.Modal'));
  const GlobalShellComponent = useRef(
    getComponentOrNull(appRegistry, 'Global.Shell')
  );
  const findInPageRole = useRef(getRoleOrNull(appRegistry, 'Find'));

  let FindInPage;
  if (findInPageRole.current) {
    FindInPage = findInPageRole.current[0].component;
  }

  return (
    <div data-test-id="home-view" css={homeViewStyles}>
      <div css={homePageStyles}>
        <div css={homePageContentStyles}>
          <WorkspaceContent
            appRegistry={appRegistry}
            namespace={namespace}
            instanceLoadingStatus={instanceLoadingStatus}
            errorLoadingInstanceMessage={errorLoadingInstanceMessage}
            isDataLake={isDataLake}
          />
        </div>
        {SidebarComponent.current && <SidebarComponent.current />}
        {FindInPage && <FindInPage />}
      </div>
      {globalModals.current &&
        globalModals.current.map((globalModal, index) => {
          const GlobalModal = globalModal.component;
          return <GlobalModal key={index} />;
        })}
      {GlobalShellComponent.current && <GlobalShellComponent.current />}
    </div>
  );
}
