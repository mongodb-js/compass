import type AppRegistry from 'hadron-app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { Document } from 'mongodb';
import React, { useCallback, useEffect } from 'react';
import {
  TabNavBar,
  css,
  withTheme,
  uiColors,
  cx,
} from '@mongodb-js/compass-components';

import CollectionHeader from '../collection-header';
import type { CollectionStatsObject } from '../../modules/stats';

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

const collectionLightStyles = css({
  background: uiColors.white,
});

const collectionDarkStyles = css({
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
  isClustered: boolean;
  isFLE: boolean;
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
  stats: CollectionStatsObject;
};

const Collection: React.FunctionComponent<CollectionProps> = ({
  darkMode,
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
  queryHistoryIndexes,
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
      if (!queryHistoryIndexes.includes(idx)) {
        localAppRegistry.emit('collapse-query-history');
      }
      localAppRegistry.emit('subtab-changed', name);
      globalAppRegistry.emit('compass:screen:viewed', { screen: name });
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

  useEffect(() => {
    function onOpenAggregationInEditor() {
      changeActiveSubTab(2, id);
    }

    localAppRegistry.on('open-aggregation-in-editor', onOpenAggregationInEditor);

    return () => {
      localAppRegistry.removeListener(
        'open-aggregation-in-editor',
        onOpenAggregationInEditor
      );
    };
  }, [ localAppRegistry, changeActiveSubTab, id ]);

  return (
    <div
      className={cx(
        collectionStyles,
        darkMode ? collectionDarkStyles : collectionLightStyles
      )}
      data-testid="collection"
    >
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
