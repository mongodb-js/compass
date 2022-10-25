import type AppRegistry from 'hadron-app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { Document } from 'mongodb';
import React, { useCallback, useEffect } from 'react';
import { TabNavBar, css } from '@mongodb-js/compass-components';

import CollectionHeader from '../collection-header';
import { getCollectionStatsInitialState } from '../../modules/stats';
import type { CollectionStatsMap } from '../../modules/stats';

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
  darkMode?: boolean;
  namespace: string;
  isReadonly: boolean;
  isTimeSeries: boolean;
  isClustered: boolean;
  isFLE: boolean;
  editViewName?: string;
  sourceReadonly?: boolean;
  sourceViewOn?: string;
  selectOrCreateTab: (options: any) => any;
  pipeline: Document[];
  sourceName?: string;
  activeSubTab: number;
  id: string;
  tabs: string[];
  views: JSX.Element[];
  localAppRegistry: AppRegistry;
  globalAppRegistry: AppRegistry;
  changeActiveSubTab: (activeSubTab: number, id: string) => void;
  scopedModals: {
    store: any;
    component: React.ComponentType<any>;
    actions: any;
    key: number | string;
  }[];
  stats: CollectionStatsMap;
};

const Collection: React.FunctionComponent<CollectionProps> = ({
  namespace,
  isReadonly,
  isTimeSeries,
  isClustered,
  isFLE,
  stats,
  editViewName,
  sourceReadonly,
  sourceViewOn,
  selectOrCreateTab,
  pipeline,
  sourceName,
  activeSubTab,
  id,
  tabs,
  views,
  localAppRegistry,
  globalAppRegistry,
  changeActiveSubTab,
  scopedModals,
}: CollectionProps) => {
  const activeSubTabName =
    tabs && tabs.length > 0
      ? trackingIdForTabName(tabs[activeSubTab] || 'Unknown')
      : null;

  useEffect(() => {
    if (activeSubTabName) {
      track('Screen', {
        name: activeSubTabName,
      });
    }
  }, [activeSubTabName]);

  const onSubTabClicked = useCallback(
    (idx, name) => {
      if (activeSubTab === idx) {
        return;
      }
      localAppRegistry.emit('subtab-changed', name);
      globalAppRegistry.emit('compass:screen:viewed', { screen: name });
      changeActiveSubTab(idx, id);
    },
    [id, activeSubTab, localAppRegistry, globalAppRegistry, changeActiveSubTab]
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
          isFLE={isFLE}
          editViewName={editViewName}
          sourceReadonly={sourceReadonly}
          sourceViewOn={sourceViewOn}
          selectOrCreateTab={selectOrCreateTab}
          pipeline={pipeline}
          sourceName={sourceName}
          stats={stats[namespace] ?? getCollectionStatsInitialState()}
        />
        <TabNavBar
          data-testid="collection-tabs"
          aria-label="Collection Tabs"
          tabs={tabs}
          views={views}
          activeTabIndex={activeSubTab}
          onTabClicked={(tabIdx) => onSubTabClicked(tabIdx, tabs[tabIdx])}
          mountAllViews
        />
      </div>
      <div className={collectionModalContainerStyles}>
        {scopedModals.map((modal) => (
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
