import type AppRegistry from 'hadron-app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { Document } from 'mongodb';
import React, { useCallback, useEffect } from 'react';
import { TabNavBar, css } from '@mongodb-js/compass-components';

import CollectionHeader from '../collection-header';

const { track } = createLoggerAndTelemetry('COMPASS-COLLECTION-UI');

function trackingIdForTabName(name: string) {
  return name.toLowerCase().replace(/ /g, '_');
}

const collectionStyles = css({
  display: 'flex',
  alignItems: 'stretch',
  height: '100%',
  width: '100%',
});

const collectionContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  height: '100%',
  width: '100%',
});

const collectionModalContainerStyles = css({
  zIndex: 100,
});

type CollectionProps = {
  namespace: string;
  isReadonly: boolean;
  isTimeSeries: boolean;
  isClustered: boolean;
  statsPlugin: React.FunctionComponent<{ store: any }>;
  statsStore: any;
  editViewName?: string;
  sourceReadonly: boolean;
  sourceViewOn?: string;
  selectOrCreateTab: (options: any) => any;
  pipeline: Document[];
  sourceName: string;
  activeSubTab: number;
  id: string;
  queryHistoryIndexes: number[];
  tabs: string[];
  views: JSX.Element[];
  localAppRegistry: AppRegistry;
  globalAppRegistry: AppRegistry;
  changeActiveSubTab: (
    activeSubTab: number,
    id: string
  ) => {
    type: string;
    activeSubTab: number;
    id: string;
  };
  scopedModals: any[];
};

const Collection: React.FunctionComponent<CollectionProps> = ({
  namespace,
  isReadonly,
  isTimeSeries,
  isClustered,
  statsPlugin,
  statsStore,
  editViewName,
  sourceReadonly,
  sourceViewOn,
  selectOrCreateTab,
  pipeline,
  sourceName,
  activeSubTab,
  id,
  queryHistoryIndexes,
  tabs,
  views,
  localAppRegistry,
  globalAppRegistry,
  changeActiveSubTab,
  scopedModals,
}: CollectionProps) => {
  useEffect(() => {
    if (tabs && tabs.length > 0) {
      track('Screen', {
        name: trackingIdForTabName(tabs[activeSubTab] || 'Unknown'),
      });
    }
  }, []);

  const onSubTabClicked = useCallback(
    (idx, name) => {
      if (activeSubTab === idx) {
        return;
      }
      if (!queryHistoryIndexes.includes(idx)) {
        localAppRegistry.emit('collapse-query-history');
      }
      localAppRegistry.emit('subtab-changed', name);
      globalAppRegistry.emit('compass:screen:viewed', { screen: name });
      track('Screen', { name: trackingIdForTabName(name) });
      changeActiveSubTab(idx, id);
    },
    [
      activeSubTab,
      queryHistoryIndexes,
      localAppRegistry,
      globalAppRegistry,
      changeActiveSubTab,
    ]
  );

  return (
    <div className={collectionStyles} data-testid="collection">
      <div className={collectionContainerStyles}>
        <CollectionHeader
          globalAppRegistry={globalAppRegistry}
          namespace={namespace}
          isReadonly={isReadonly}
          isTimeSeries={isTimeSeries}
          isClustered={isClustered}
          statsPlugin={statsPlugin}
          statsStore={statsStore}
          editViewName={editViewName}
          sourceReadonly={sourceReadonly}
          sourceViewOn={sourceViewOn}
          selectOrCreateTab={selectOrCreateTab}
          pipeline={pipeline}
          sourceName={sourceName}
        />
        <TabNavBar
          data-test-id="collection-tabs"
          aria-label="Collection Tabs"
          tabs={tabs}
          views={views}
          activeTabIndex={activeSubTab}
          onTabClicked={(tabIdx) => onSubTabClicked(tabIdx, tabs[tabIdx])}
          mountAllViews
        />
      </div>

      <div className={collectionModalContainerStyles}>
        {scopedModals.map((modal: any) => (
          <modal.component
            store={modal.store}
            actions={modal.actions}
            key={modal.key}
          />
        ))}
      </div>
    </div>
  );
};

export default Collection;
