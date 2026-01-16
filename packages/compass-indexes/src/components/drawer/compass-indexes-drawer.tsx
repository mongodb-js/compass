import React, { useContext } from 'react';
import { css, DrawerSection, spacing } from '@mongodb-js/compass-components';
import {
  INDEXES_DRAWER_ID,
  IndexesDrawerContext,
  IndexesDrawerProvider,
  useIndexesDrawerActions,
} from './compass-indexes-drawer-provider';
import IndexesListPage from './pages/indexes-list-page';
import { useActiveWorkspace } from '@mongodb-js/compass-workspaces/provider';
import {
  activateIndexesPlugin,
  type IndexesDataServiceProps,
} from '../../stores/store';
import {
  connectionInfoRefLocator,
  type DataServiceLocator,
  dataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import {
  collectionModelLocator,
  mongoDBInstanceLocator,
} from '@mongodb-js/compass-app-stores/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';

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
 */
const CompassIndexesDrawer: React.FunctionComponent<{
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

export const CompassIndexesDrawerPlugin = registerCompassPlugin(
  {
    name: 'CompassIndexesDrawer',
    component: () => {
      return (
        <IndexesDrawerProvider>
          <CompassIndexesDrawer />
        </IndexesDrawerProvider>
      );
    },
    activate: activateIndexesPlugin,
  },
  {
    dataService:
      dataServiceLocator as DataServiceLocator<IndexesDataServiceProps>,
    connectionInfoRef: connectionInfoRefLocator,
    instance: mongoDBInstanceLocator,
    logger: createLoggerLocator('COMPASS-INDEXES-DRAWER'),
    track: telemetryLocator,
    collection: collectionModelLocator,
    atlasService: atlasServiceLocator,
    preferences: preferencesLocator,
  }
);
