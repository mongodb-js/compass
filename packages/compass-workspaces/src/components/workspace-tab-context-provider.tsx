import React, { useCallback, useEffect, useRef } from 'react';
import { getLocalAppRegistryForTab } from '../stores/workspaces';
import type { WorkspaceTab } from '../types';
import { NamespaceProvider } from '@mongodb-js/compass-app-stores/provider';
import {
  ConnectionInfoProvider,
  ConnectionThemeProvider,
} from '@mongodb-js/compass-connections/provider';
import { css, rafraf } from '@mongodb-js/compass-components';
import { useOnTabReplace } from './workspace-close-handler';
import {
  useTabState,
  WorkspaceTabStateProvider,
} from './workspace-tab-state-provider';
import { AppRegistryProvider } from '@mongodb-js/compass-app-registry';
import { useWorkspacePlugins } from './workspaces-provider';

const workspaceTabCloseHandlerStyles = css({
  display: 'contents',
});

function getInitialPropsForWorkspace(tab: WorkspaceTab) {
  switch (tab.type) {
    case 'Welcome':
    case 'My Queries':
    case 'Data Modeling':
    case 'Performance':
    case 'Databases':
      return null;
    case 'Shell':
      return {
        initialEvaluate: tab.initialEvaluate,
        initialInput: tab.initialInput,
      };
    case 'Collections':
      return { namespace: tab.namespace };
    case 'Collection': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, type, connectionId, ...collectionMetadata } = tab;
      return { tabId: id, ...collectionMetadata };
    }
  }
}

const TabCloseHandler: React.FunctionComponent = ({ children }) => {
  const mountedRef = useRef(false);
  const [hasInteractedOnce, setHasInteractedOnce] = useTabState(
    'hasInteractedOnce',
    false
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  });

  const markAsInteracted = useCallback(() => {
    // Make sure we don't count clicking on buttons that actually cause the
    // workspace to change, like using breadcrumbs or clicking on an item in the
    // Databases / Collections list. There are certain corner-cases this doesn't
    // handle, but it's good enough to prevent most cases where users can lose
    // content by accident
    rafraf(() => {
      if (mountedRef.current) {
        setHasInteractedOnce(true);
      }
    });
  }, [setHasInteractedOnce]);

  useOnTabReplace(() => {
    return !hasInteractedOnce;
  });

  return (
    // We're not using these for actual user interactions, just to capture the
    // interacted state
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={workspaceTabCloseHandlerStyles}
      onKeyDown={markAsInteracted}
      onClickCapture={markAsInteracted}
    >
      {children}
    </div>
  );
};

type WorkspaceTabContextProviderProps = {
  tab: WorkspaceTab;
  children: React.JSX.Element;
} & (
  | {
      sectionType: 'tab-content';
      onNamespaceNotFound: (
        tab: Extract<WorkspaceTab, { namespace: string }>,
        fallbackNamespace: string | null
      ) => void;
    }
  | {
      sectionType: 'tab-title';
      onNamespaceNotFound?: undefined;
    }
);

const WorkspaceTabContextProvider: React.FunctionComponent<
  WorkspaceTabContextProviderProps
> = ({ tab, onNamespaceNotFound, sectionType: type, children }) => {
  const initialProps = getInitialPropsForWorkspace(tab);
  const { getWorkspacePluginByName } = useWorkspacePlugins();

  const { provider: WorkspaceProvider } = getWorkspacePluginByName(tab.type);

  if (initialProps) {
    children = React.cloneElement(children, initialProps);
  }

  // The ordering of the these providers is important,
  // the workspace provider needs access to the
  // connection info and namespace providers.
  children = (
    <WorkspaceProvider {...initialProps}>{children}</WorkspaceProvider>
  );

  if ('namespace' in tab) {
    children = (
      <NamespaceProvider
        namespace={tab.namespace}
        onNamespaceFallbackSelect={(ns) => {
          onNamespaceNotFound?.(tab, ns);
        }}
      >
        {children}
      </NamespaceProvider>
    );
  }

  if ('connectionId' in tab) {
    children = (
      <ConnectionInfoProvider connectionInfoId={tab.connectionId}>
        {children}
      </ConnectionInfoProvider>
    );
  }

  if (type === 'tab-content') {
    children = <TabCloseHandler>{children}</TabCloseHandler>;
  }

  return (
    <WorkspaceTabStateProvider id={tab.id}>
      <AppRegistryProvider
        key={tab.id}
        scopeName="Workspace Tab"
        localAppRegistry={getLocalAppRegistryForTab(tab.id)}
        deactivateOnUnmount={false}
      >
        <ConnectionThemeProvider
          connectionId={'connectionId' in tab ? tab.connectionId : undefined}
        >
          {children}
        </ConnectionThemeProvider>
      </AppRegistryProvider>
    </WorkspaceTabStateProvider>
  );
};

export { WorkspaceTabContextProvider };
