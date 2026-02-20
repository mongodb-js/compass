import React from 'react';
import { css, DrawerSection, spacing } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { connect } from 'react-redux';
import type { RootState } from './modules';
import IndexesListDrawerView from './components/drawer/views/indexes-list-drawer-view';
import type { CollectionSubtab } from '@mongodb-js/workspace-info';
import CreateSearchIndexView from './components/drawer/views/create-search-index-view';
import EditSearchIndexView from './components/drawer/views/edit-search-index-view';
import { INDEXES_DRAWER_ID } from './modules/indexes-drawer';
import type { IndexesDrawerViewType } from './modules/indexes-drawer';
import CreateIndexModal from './components/create-index-modal/create-index-modal';

const indexesTitleStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const indexesTitleTextStyles = css({
  marginRight: spacing[200],
});

type DrawerProps = {
  currentView: IndexesDrawerViewType;
  subTab?: CollectionSubtab;
};

/**
 * Drawer component that wraps search indexes management in a DrawerSection.
 */
const Drawer = ({ currentView, subTab }: DrawerProps) => {
  const isIndexesDrawerEnabled = usePreference(
    'enableSearchActivationProgramP1'
  );

  if (!isIndexesDrawerEnabled || subTab === 'Indexes') {
    return null;
  }

  return (
    <>
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
          {currentView === 'indexes-list' && <IndexesListDrawerView />}
          {currentView === 'create-search-index' && <CreateSearchIndexView />}
          {currentView === 'edit-search-index' && <EditSearchIndexView />}
        </div>
      </DrawerSection>
      {/* The drawer tab will re-use this modal for creating regular indexes */}
      <CreateIndexModal />
    </>
  );
};

const mapState = ({ indexesDrawer }: RootState) => ({
  currentView: indexesDrawer.currentView,
});

export const IndexesDrawer = connect(mapState)(Drawer);
