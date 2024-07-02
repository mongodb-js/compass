import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  BannerVariant,
  Button,
  EmptyContent,
  Link,
  css,
  spacing,
  Icon,
} from '@mongodb-js/compass-components';
import { DatabasesList } from '@mongodb-js/databases-collections-list';
import { usePreference } from 'compass-preferences-model/provider';
import { AddDataZeroGraphic, ZeroGraphic } from './zero-graphic';
import type { Database, DatabasesState } from '../modules/databases';
import {
  createDatabase,
  dropDatabase,
  refreshDatabases,
} from '../modules/databases';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';
import toNS from 'mongodb-ns';

const errorContainerStyles = css({
  padding: spacing[400],
});

const nonGenuineErrorContainerStyles = css({
  width: '100%',
});

const NON_GENUINE_SUBTEXT =
  'This server or service appears to be emulating' +
  ' MongoDB. Some documented MongoDB features may work differently, may be' +
  ' entirely missing or incomplete, or may have unexpectedly different' +
  ' performance characteristics than would be found when connecting to a' +
  ' real MongoDB server or service.';

const DOCUMENTATION_LINK = 'https://www.mongodb.com/atlas/database';

const ERROR_WARNING = 'An error occurred while loading databases';

function NonGenuineZeroState() {
  return (
    <div
      className={nonGenuineErrorContainerStyles}
      data-testid="databases-non-genuine-warning"
    >
      <EmptyContent
        icon={ZeroGraphic}
        title="Unable to display databases and collections"
        subTitle={NON_GENUINE_SUBTEXT}
        callToActionLink={
          <Link href={DOCUMENTATION_LINK}>Try MongoDB Atlas</Link>
        }
      />
    </div>
  );
}

function buildAddDataUrl(projectId: string, clusterName: string) {
  const url = new URL(
    `/v2/${projectId}#/addData/${encodeURIComponent(clusterName)}/load`,
    window.location.origin
  );
  return url.toString();
}

const addDataContainerStyles = css({
  width: '100%',
  padding: spacing[400],
});

const addDataActionsStyles = css({
  display: 'flex',
  gap: spacing[300],
});

function AddDataZeroState({
  projectId,
  clusterName,
  canCreateDatabase,
  onCreateDatabase,
}: {
  projectId: string;
  clusterName: string;
  canCreateDatabase: boolean;
  onCreateDatabase: () => void;
}) {
  return (
    <div className={addDataContainerStyles} data-testid="add-data-zero-state">
      <EmptyContent
        icon={AddDataZeroGraphic}
        title="Looks like your cluster is empty"
        subTitle={
          canCreateDatabase ? (
            <>
              Create database or load sample data to your cluster to quickly get
              started experimenting with data in MongoDB.
            </>
          ) : (
            <>
              You can load sample data to quickly get started experimenting with
              data in MongoDB.
            </>
          )
        }
        callToActionLink={
          <div className={addDataActionsStyles}>
            {canCreateDatabase && (
              <Button variant="default" onClick={onCreateDatabase}>
                Create database
              </Button>
            )}
            <Button
              variant="primary"
              href={buildAddDataUrl(projectId, clusterName)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Load sample dataset
            </Button>
          </div>
        }
      />
    </div>
  );
}

const addDataBannerContent = css({
  display: 'flex',
  alignItems: 'center',
});

const addDataBannerButtonStyles = css({
  marginLeft: 'auto',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const EmptyElement = () => null;

function AddDataZeroBanner({
  projectId,
  clusterName,
}: {
  projectId: string;
  clusterName: string;
}) {
  return (
    <Banner image={<EmptyElement></EmptyElement>}>
      <div className={addDataBannerContent}>
        <span>
          Working with MongoDB is easy, but first you’ll need some data to get
          started. Sample data is available for loading.
        </span>
        <Button
          className={addDataBannerButtonStyles}
          onClick={() => {
            // Leafygreen overrides anchor tag styles inside the banner in a way
            // that completely breaks the button visuals and there is no good
            // way for us to hack around it, so instead of a link, we're using a
            // button and open a url with browser APIs
            window.open(
              buildAddDataUrl(projectId, clusterName),
              '_blank',
              'noopener noreferrer'
            );
          }}
          leftGlyph={<Icon glyph="Upload"></Icon>}
          size="small"
        >
          Load sample data
        </Button>
      </div>
    </Banner>
  );
}

type DatabasesProps = {
  databases: ReturnType<Database['toJSON']>[];
  databasesLoadingStatus: string;
  databasesLoadingError: string | null;
  isWritable: boolean;
  isGenuineMongoDB: boolean;
  isDataLake: boolean;
  onDeleteDatabaseClick(connectionId: string, ns: string): void;
  onCreateDatabaseClick(connectionId: string): void;
  onRefreshClick(): void;
};

const Databases: React.FunctionComponent<DatabasesProps> = ({
  databases,
  databasesLoadingStatus,
  databasesLoadingError,
  isWritable,
  isDataLake,
  isGenuineMongoDB,
  onDeleteDatabaseClick: _onDeleteDatabaseClick,
  onCreateDatabaseClick: _onCreateDatabaseClick,
  onRefreshClick,
}) => {
  const { id: connectionId, atlasMetadata } = useConnectionInfo();
  const isPreferencesReadOnly = usePreference('readOnly');
  const { openCollectionsWorkspace } = useOpenWorkspace();

  const onDatabaseClick = useCallback(
    (ns: string) => {
      openCollectionsWorkspace(connectionId, ns);
    },
    [connectionId, openCollectionsWorkspace]
  );

  const onDeleteDatabaseClick = useCallback(
    (ns: string) => {
      _onDeleteDatabaseClick(connectionId, ns);
    },
    [connectionId, _onDeleteDatabaseClick]
  );

  const onCreateDatabaseClick = useCallback(() => {
    _onCreateDatabaseClick(connectionId);
  }, [connectionId, _onCreateDatabaseClick]);

  useTrackOnChange((track: TrackFunction) => {
    track('Screen', { name: 'databases' });
  }, []);

  const renderBanner = useCallback(() => {
    if (
      !atlasMetadata ||
      databases.some((db) => {
        return !toNS(db.name).specialish;
      })
    ) {
      return null;
    }

    return (
      <AddDataZeroBanner
        projectId={atlasMetadata.projectId}
        clusterName={atlasMetadata.clusterName}
      ></AddDataZeroBanner>
    );
  }, [databases, atlasMetadata]);

  const editable = isWritable && !isPreferencesReadOnly;

  if (databasesLoadingStatus === 'fetching') {
    return null;
  }

  if (databasesLoadingStatus === 'error') {
    return (
      <div className={errorContainerStyles}>
        <Banner variant={BannerVariant.Danger}>
          {databasesLoadingError
            ? `${ERROR_WARNING}: ${databasesLoadingError}`
            : ERROR_WARNING}
        </Banner>
      </div>
    );
  }

  if (databases.length === 0 && !isGenuineMongoDB) {
    return <NonGenuineZeroState />;
  }

  if (atlasMetadata && databases.length === 0) {
    return (
      <AddDataZeroState
        projectId={atlasMetadata.projectId}
        clusterName={atlasMetadata.clusterName}
        canCreateDatabase={editable}
        onCreateDatabase={onCreateDatabaseClick}
      ></AddDataZeroState>
    );
  }

  const actions = Object.assign(
    {
      onDatabaseClick,
      onRefreshClick,
    },
    editable && !isDataLake
      ? {
          onDeleteDatabaseClick,
          onCreateDatabaseClick,
        }
      : {}
  );

  return (
    <DatabasesList
      databases={databases}
      renderBanner={renderBanner}
      {...actions}
    />
  );
};

const mapStateToProps = (state: DatabasesState) => {
  return {
    databases: state.databases,
    databasesLoadingStatus: state.databasesLoadingStatus.status,
    databasesLoadingError: state.databasesLoadingStatus.error,
    isWritable: state.instance.isWritable,
    isDataLake: state.instance.isDataLake,
    isGenuineMongoDB: state.instance.isGenuineMongoDB,
  };
};

const mapDispatchToProps = {
  onRefreshClick: refreshDatabases,
  onDeleteDatabaseClick: dropDatabase,
  onCreateDatabaseClick: createDatabase,
};

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const ConnectedDatabases = connect(
  mapStateToProps,
  mapDispatchToProps
)(Databases) as React.FunctionComponent<Record<string, never>>;

export default ConnectedDatabases;
export { Databases };
