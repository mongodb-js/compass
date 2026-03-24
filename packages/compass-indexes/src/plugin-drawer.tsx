import React, { useCallback } from 'react';
import {
  css,
  DrawerSection,
  showConfirmation,
  spacing,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { connect } from 'react-redux';
import type { RootState } from './modules';
import IndexesListDrawerView from './components/drawer-views/indexes-list-drawer-view';
import type { CollectionSubtab } from '@mongodb-js/workspace-info';
import CreateSearchIndexView from './components/drawer-views/create-search-index-drawer-view';
import EditSearchIndexView from './components/drawer-views/edit-search-index-drawer-view';
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
  isDirty: boolean;
  subTab?: CollectionSubtab;
};

/**
 * Drawer component that wraps search indexes management in a DrawerSection.
 */
const Drawer = ({ currentView, isDirty, subTab }: DrawerProps) => {
  const isIndexesDrawerEnabled = usePreference(
    'enableSearchActivationProgramP1'
  );

  const beforeSectionHide = useCallback(async () => {
    if (!isDirty) {
      return true;
    }

    return await showConfirmation({
      title: 'Any unsaved progress will be lost',
      buttonText: 'Discard',
      variant: 'danger',
      description: 'Are you sure you want to continue?',
    });
  }, [isDirty]);

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
        beforeSectionHide={beforeSectionHide}
        guideCue={{
          cueId: 'indexes-drawer',
          title: 'Easily access all your search indexes',
          description: 'Click to view and manage search indexes.',
          buttonText: 'Got it',
          tooltipAlign: 'left',
          tooltipJustify: 'start',
        }}
      >
        {currentView === 'indexes-list' && <IndexesListDrawerView />}
        {currentView === 'create-search-index' && <CreateSearchIndexView />}
        {currentView === 'edit-search-index' && <EditSearchIndexView />}
      </DrawerSection>
      {/* The drawer tab will re-use this modal for creating regular indexes */}
      <CreateIndexModal />
    </>
  );
};

const mapState = ({ indexesDrawer }: RootState) => ({
  currentView: indexesDrawer.currentView,
  isDirty: indexesDrawer.isDirty,
});

export const IndexesDrawer = connect(mapState)(Drawer);
