import React, { useContext } from 'react';
import { css, DrawerSection, spacing } from '@mongodb-js/compass-components';
import {
  INDEXES_DRAWER_ID,
  IndexesDrawerContext,
  useIndexesDrawerActions,
} from './compass-indexes-provider';
import { IndexesListPage } from './components/indexes-list-page';
import { useIndexesDrawerGlobalState } from './indexes-drawer-global-state';

const indexesTitleStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const indexesTitleTextStyles = css({
  marginRight: spacing[200],
});

/**
 * CompassIndexesDrawer component that wraps search indexes management in a DrawerSection.
 * This component can be placed at any level in the component tree as long as
 * it's within an IndexesDrawerProvider.
 */
export const CompassIndexesDrawer: React.FunctionComponent<{
  autoOpen?: boolean;
}> = ({ autoOpen = false }) => {
  const drawerGlobalState = useIndexesDrawerGlobalState();
  const drawerState = useContext(IndexesDrawerContext);
  const { getIsIndexesDrawerEnabled } = useIndexesDrawerActions();

  if (
    !getIsIndexesDrawerEnabled() ||
    drawerGlobalState.activeWorkspace?.type !== 'Collection'
  ) {
    return null;
  }

  if (!drawerState) {
    throw new Error(
      'CompassIndexesDrawer must be used within an IndexesDrawerProvider'
    );
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
      autoOpen={autoOpen}
    >
      <div>
        {drawerState.currentPage === 'indexes-list' && <IndexesListPage />}
      </div>
    </DrawerSection>
  );
};
