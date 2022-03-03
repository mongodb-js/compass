import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, compassUIColors, css, cx } from '@mongodb-js/compass-components';
import CollectionHeader from '../collection-header';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-COLLECTION-UI');

function trackingIdForTabName(name) {
  return name.toLowerCase().replace(/ /g, '_');
}

import styles from './collection.module.less';

const containerStyles = css({
  background: 'white',
});

const collectionWorkspaceContainerStyles = css({
  height: '100%',
  background: compassUIColors.gray8,
  overflow: 'auto'
});

const hiddenStyles = css({
  display: 'none'
});

function Collection({
  namespace,
  isReadonly,
  isTimeSeries,
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
}) {
  useEffect(() => {
    if (tabs && tabs.length > 0) {
      track('Screen', {
        name: trackingIdForTabName(tabs[activeSubTab] || 'Unknown')
      });
    }
  }, []);

  const onSubTabClicked = useCallback((idx, name) => {
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
  }, [ activeSubTab, queryHistoryIndexes, localAppRegistry, globalAppRegistry, changeActiveSubTab ]);

  return (
    <div className={styles.collection}>
      {/* <div className={cx(styles.collection, 'clearfix')}> */}
      <div className={styles['collection-container']}>
        <CollectionHeader
          globalAppRegistry={globalAppRegistry}
          namespace={namespace}
          isReadonly={isReadonly}
          isTimeSeries={isTimeSeries}
          statsPlugin={statsPlugin}
          statsStore={statsStore}
          editViewName={editViewName}
          sourceReadonly={sourceReadonly}
          sourceViewOn={sourceViewOn}
          selectOrCreateTab={selectOrCreateTab}
          pipeline={pipeline}
          sourceName={sourceName}
        />
        {/* <TabNavBar
            data-test-id="collection-tabs"
            aria-label="Collection Tabs"
            tabs={tabs}
            views={views}
            activeTabIndex={activeSubTab}
            onTabClicked={this.onSubTabClicked} /> */}
        <Tabs
          data-test-id="collection-tabs"
          aria-label="Collection Tabs"
          className={containerStyles}
          setSelected={(tabIdx) => {
            onSubTabClicked(tabIdx, tabs[tabIdx]);
          }}
          selected={activeSubTab}
        >
          {tabs.map((tab, idx) => (
            <Tab
              className="test-tab-nav-bar-tab"
              key={`tab-${idx}`}
              name={tab}
            />
          ))}
        </Tabs>
        {views.map((view, idx) => (
          <div
            key={`tab-content-${idx}`}
            data-test-id={`${tabs[idx].toLowerCase().replace(/ /g, '-')}-content`}
            className={cx(collectionWorkspaceContainerStyles, {
              [hiddenStyles]: idx !== activeSubTab
            })}
          >
            {view}
          </div>
        ))}
      </div>

      {/* TODO: Skeleton container component compass-components */}

      <div className={styles['collection-modal-container']}>
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
}

Collection.displayName = 'CollectionComponent';

Collection.propTypes = {
  namespace: PropTypes.string.isRequired,
  isTimeSeries: PropTypes.bool,
  isReadonly: PropTypes.bool.isRequired,
  tabs: PropTypes.array.isRequired,
  views: PropTypes.array.isRequired,
  scopedModals: PropTypes.array.isRequired,
  queryHistoryIndexes: PropTypes.array.isRequired,
  statsPlugin: PropTypes.func.isRequired,
  selectOrCreateTab: PropTypes.func.isRequired,
  statsStore: PropTypes.object.isRequired,
  localAppRegistry: PropTypes.object.isRequired,
  globalAppRegistry: PropTypes.object.isRequired,
  activeSubTab: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  sourceName: PropTypes.string,
  sourceReadonly: PropTypes.bool.isRequired,
  sourceViewOn: PropTypes.string,
  editViewName: PropTypes.string,
  pipeline: PropTypes.array,
  changeActiveSubTab: PropTypes.func.isRequired
};

export default Collection;
