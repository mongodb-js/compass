import React from 'react';
import { css, DrawerSection, spacing } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { connect } from 'react-redux';
import type { RootState } from './modules';
import IndexesListDrawerView from './components/drawer/views/indexes-list-drawer-view';
import { CollectionSubtab } from '@mongodb-js/workspace-info';

const indexesTitleStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const indexesTitleTextStyles = css({
  marginRight: spacing[200],
});

const INDEXES_DRAWER_ID = 'compass-indexes-drawer';

/**
 * Drawer component that wraps search indexes management in a DrawerSection.
 */
const Drawer = ({
  indexesDrawer,
  subTab,
}: {
  indexesDrawer: RootState['indexesDrawer'];
  subTab?: CollectionSubtab;
}) => {
  const isIndexesDrawerEnabled = usePreference(
    'enableSearchActivationProgramP1'
  );

  if (!isIndexesDrawerEnabled || subTab === 'Indexes') {
    return null;
  }

  return (
    <DrawerSection
      id={INDEXES_DRAWER_ID}
      title={
        <div className={indexesTitleStyles}>
          <span className={indexesTitleTextStyles}>Indexes</span>
        </div>
      }
      label="Indexes"
      glyph="SearchIndex"
    >
      <div>
        {indexesDrawer.currentView === 'indexes-list' && (
          <IndexesListDrawerView />
        )}
      </div>
    </DrawerSection>
  );
};

export const IndexesDrawer = connect(({ indexesDrawer }: RootState) => ({
  indexesDrawer,
}))(Drawer);
