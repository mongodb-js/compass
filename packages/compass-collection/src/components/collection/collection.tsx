import type AppRegistry from 'hadron-app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { Document } from 'mongodb';
import React, { useCallback, useEffect } from 'react';
import {
  TabNavBar,
  css,
  withTheme,
  uiColors,
} from '@mongodb-js/compass-components';

import CollectionHeader from '../collection-header';
import type { StatsObject } from '../../modules/stats';

const { track } = createLoggerAndTelemetry('COMPASS-COLLECTION-UI');

function trackingIdForTabName(name: string) {
  return name.toLowerCase().replace(/ /g, '_');
}

const collectionLightStyles = css({
  display: 'flex',
  alignItems: 'stretch',
  height: '100%',
  width: '100%',
  background: uiColors.white,
});

const collectionDarkStyles = css({
  display: 'flex',
  alignItems: 'stretch',
  height: '100%',
  width: '100%',
  backgroundColor: uiColors.gray.dark3,
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
  stats: StatsObject;
};

const Collection: React.FunctionComponent<CollectionProps> = (
  props: CollectionProps
) => {
  const {
    darkMode,
    namespace,
    isReadonly,
    isTimeSeries,
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
    stats,
  } = props;
  useEffect(() => {
    if (tabs && tabs.length > 0) {
      track('Screen', {
        name: trackingIdForTabName(tabs[activeSubTab] || 'Unknown'),
      });
    }
  });

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
      id,
      activeSubTab,
      queryHistoryIndexes,
      localAppRegistry,
      globalAppRegistry,
      changeActiveSubTab,
    ]
  );

  return (
    <div
      className={darkMode ? collectionDarkStyles : collectionLightStyles}
      data-testid="collection"
    >
      <div className={collectionContainerStyles}>
        <CollectionHeader
          globalAppRegistry={globalAppRegistry}
          namespace={namespace}
          isReadonly={isReadonly}
          isTimeSeries={isTimeSeries}
          editViewName={editViewName}
          sourceReadonly={sourceReadonly}
          sourceViewOn={sourceViewOn}
          selectOrCreateTab={selectOrCreateTab}
          pipeline={pipeline}
          sourceName={sourceName}
          stats={stats}
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

export default withTheme(Collection);
