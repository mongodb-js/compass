import React from 'react';
import { css, DrawerSection, spacing } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { connect } from 'react-redux';
import type { RootState } from './modules';
import IndexesListDrawerView from './components/drawer/views/indexes-list-drawer-view';
import type { CollectionSubtab } from '@mongodb-js/workspace-info';
import CreateSearchIndexView from './components/drawer/views/create-search-index-view';
import EditSearchIndexView from './components/drawer/views/edit-search-index-view';
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

export const INDEXES_DRAWER_ID = 'compass-indexes-drawer';
const INDEXES_DRAWER_ID_DISABLED = 'compass-indexes-drawer-disabled';

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

  if (!isIndexesDrawerEnabled) {
    return null;
  }

  return (
    <>
      <DrawerSection
        id={
          subTab === 'Indexes' ? INDEXES_DRAWER_ID_DISABLED : INDEXES_DRAWER_ID
        }
        title={
          <div className={indexesTitleStyles}>
            <span className={indexesTitleTextStyles}>Indexes</span>
          </div>
        }
        label={
          subTab === 'Indexes'
            ? 'You are already on the indexes page'
            : 'Indexes'
        }
        glyph="SearchIndex"
        disabled={subTab === 'Indexes'}
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
