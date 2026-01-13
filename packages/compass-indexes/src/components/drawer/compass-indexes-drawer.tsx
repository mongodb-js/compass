import React, { useContext } from 'react';
import { css, DrawerSection, spacing } from '@mongodb-js/compass-components';
import {
  INDEXES_DRAWER_ID,
  IndexesDrawerContext,
  useIndexesDrawerActions,
} from './compass-indexes-provider';
import { IndexesListPage } from './pages/indexes-list-page';
import { useActiveWorkspace } from '@mongodb-js/compass-workspaces/provider';

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
 * This component is rendered at the app level but only shows when inside a Collection workspace.
 */
export const CompassIndexesDrawer: React.FunctionComponent<{
  autoOpen?: boolean;
}> = ({ autoOpen = false }) => {
  const drawerState = useContext(IndexesDrawerContext);
  const { getIsIndexesDrawerEnabled } = useIndexesDrawerActions();
  const activeWorkspace = useActiveWorkspace();

  if (!getIsIndexesDrawerEnabled() || activeWorkspace?.type !== 'Collection') {
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
