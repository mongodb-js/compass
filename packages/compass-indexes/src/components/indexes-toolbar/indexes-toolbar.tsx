import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
  usePreference,
  withPreferences,
} from 'compass-preferences-model/provider';
import {
  Banner,
  BannerVariant,
  Button,
  css,
  DropdownMenuButton,
  ErrorSummary,
  Icon,
  Link,
  PerformanceSignals,
  SegmentedControl,
  SegmentedControlOption,
  SignalPopover,
  spacing,
  SpinLoader,
  Tooltip,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import semver from 'semver';

import type { RootState } from '../../modules';
import { createSearchIndexOpened } from '../../modules/search-indexes';
import { getAtlasSearchIndexesLink } from '../../utils/atlas-search-indexes-link';
import { createIndexOpened } from '../../modules/create-index';
import type { IndexView } from '../../modules/index-view';
import { indexViewChanged } from '../../modules/index-view';
import { getAtlasUpgradeClusterLink } from '../../utils/atlas-upgrade-cluster-link';

const toolbarButtonsContainer = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[200],
  justifyContent: 'flex-start',
  alignItems: 'center',
});

const indexesToolbarContainerStyles = css({
  padding: spacing[400],
  paddingBottom: 0,
});

const alignSelfEndStyles = css({
  marginLeft: 'auto',
});

const spinnerStyles = css({ marginRight: spacing[200] });

const createIndexButtonContainerStyles = css({
  display: 'inline-block',
  width: 'fit-content',
});

const viewContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  //alignItems: 'flex-end',
  //gap: spacing[200],
});

const MIN_SEARCH_INDEX_MANAGEMENT_SERVER_VERSION = '6.0.7';

const serverSupportsSearchIndexManagement = (serverVersion: string) => {
  try {
    return semver.gte(
      serverVersion,
      MIN_SEARCH_INDEX_MANAGEMENT_SERVER_VERSION
    );
  } catch {
    return false;
  }
};

type IndexesToolbarProps = {
  namespace: string;
  indexView: IndexView;
  errorMessage: string | null;
  hasTooManyIndexes: boolean;
  showAtlasSearchLink: boolean;
  isRefreshing: boolean;
  onRefreshIndexes: () => void;
  onIndexViewChanged: (newView: IndexView) => void;
  serverVersion: string;
  // connected:
  isReadonlyView: boolean;
  isWritable: boolean;
  onCreateRegularIndexClick: () => void;
  onCreateSearchIndexClick: () => void;
  writeStateDescription?: string;
  isSearchIndexesSupported: boolean;
  // via withPreferences:
  readOnly?: boolean;
};

export const IndexesToolbar: React.FunctionComponent<IndexesToolbarProps> = ({
  namespace,
  indexView,
  errorMessage,
  isReadonlyView,
  isWritable,
  onCreateRegularIndexClick,
  onCreateSearchIndexClick,
  isRefreshing,
  writeStateDescription,
  hasTooManyIndexes,
  showAtlasSearchLink,
  isSearchIndexesSupported,
  onRefreshIndexes,
  onIndexViewChanged,
  serverVersion,
  readOnly, // preferences readOnly.
}) => {
  const isSearchManagementActive = usePreference('enableAtlasSearchIndexes');
  const { atlasMetadata } = useConnectionInfo();
  const showInsights = usePreference('showInsights') && !errorMessage;
  const showCreateIndexButton = !isReadonlyView && !readOnly && !errorMessage;
  const mongoDBMajorVersion = serverVersion.split('.').slice(0, 2).join('.');
  const refreshButtonIcon = isRefreshing ? (
    <div className={spinnerStyles}>
      <SpinLoader title="Refreshing Indexes" />
    </div>
  ) : (
    <Icon glyph="Refresh" title="Refresh Indexes" />
  );

  const renderViewBanner = (
    serverVersion: string,
    mongoDBMajorVersion: string
  ) => {
    const version = parseFloat(mongoDBMajorVersion);
    if (version < 8.0) {
      return (
        <Banner variant={BannerVariant.Warning}>
          <b>Looking for search indexes?</b>
          <br />
          <div className={viewContentStyles}>
            <span>
              Your MongoDB version is {serverVersion}. Creating and managing
              search indexes on views in Compass is supported on MongoDB version
              8.1 or higher. Upgrade your cluster to create search indexes on
              views.
            </span>
            {atlasMetadata && (
              <Button
                size="xsmall"
                onClick={() => {
                  window.open(
                    getAtlasUpgradeClusterLink({
                      clusterName: atlasMetadata.clusterName,
                    }),
                    '_blank'
                  );
                }}
              >
                Upgrade Cluster
              </Button>
            )}
          </div>
        </Banner>
      );
    }

    if (version === 8.0) {
      return (
        <Banner variant={BannerVariant.Warning}>
          <b>Looking for search indexes?</b>
          <br />
          <div className={viewContentStyles}>
            <span>
              Your MongoDB version is {serverVersion}. Creating and managing
              search indexes on views in Compass is supported on MongoDB version
              8.1 or higher. Upgrade your cluster or manage search indexes on
              views in the Atlas UI.
            </span>
            {atlasMetadata && (
              <Button
                size="xsmall"
                onClick={() => {
                  window.open(
                    getAtlasSearchIndexesLink({
                      clusterName: atlasMetadata.clusterName,
                      namespace,
                    }),
                    '_blank'
                  );
                }}
              >
                Go to Atlas
              </Button>
            )}
          </div>
        </Banner>
      );
    }
    if (version > 8.0) {
      return (
        <Banner variant={BannerVariant.Warning}>
          <b>Looking for search indexes?</b>
          <br />
          This view is incompatible with search indexes. To use search indexes,
          edit the view to only contain $addFields, $set, or $match stages with
          the $expr operator. You can view all search indexes under INSERT LINK.
        </Banner>
      );
    }
    return null;
  };

  return (
    <div
      className={indexesToolbarContainerStyles}
      data-testid="indexes-toolbar-container"
    >
      {!isReadonlyView && (
        <div data-testid="indexes-toolbar">
          <div className={toolbarButtonsContainer}>
            {showCreateIndexButton && (
              <Tooltip
                enabled={!isWritable}
                align="top"
                justify="middle"
                trigger={
                  <div className={createIndexButtonContainerStyles}>
                    <CreateIndexButton
                      isSearchManagementActive={isSearchManagementActive}
                      isSearchIndexesSupported={isSearchIndexesSupported}
                      isWritable={isWritable}
                      onCreateRegularIndexClick={onCreateRegularIndexClick}
                      onCreateSearchIndexClick={onCreateSearchIndexClick}
                    ></CreateIndexButton>
                  </div>
                }
              >
                {writeStateDescription}
              </Tooltip>
            )}
            <Button
              data-testid="refresh-indexes-button"
              disabled={isRefreshing}
              onClick={() => onRefreshIndexes()}
              variant="default"
              size="small"
              leftGlyph={refreshButtonIcon}
            >
              Refresh
            </Button>
            {showAtlasSearchLink && atlasMetadata && (
              <Link
                href={getAtlasSearchIndexesLink({
                  clusterName: atlasMetadata.clusterName,
                  namespace,
                })}
                hideExternalIcon
                arrowAppearance="persist"
              >
                Manage your search indexes
              </Link>
            )}
            {showInsights && hasTooManyIndexes && (
              <SignalPopover
                signals={PerformanceSignals.get('too-many-indexes')}
              />
            )}
            {isSearchManagementActive && (
              <SegmentedControl
                size="xsmall"
                onChange={(evt) => onIndexViewChanged(evt as IndexView)}
                className={alignSelfEndStyles}
                label="Viewing"
                value={indexView}
                data-testid="indexes-segment-controls"
              >
                <SegmentedControlOption
                  data-testid="regular-indexes-tab"
                  value="regular-indexes"
                >
                  Indexes
                </SegmentedControlOption>
                {!isSearchIndexesSupported && (
                  <Tooltip
                    align="top"
                    justify="end"
                    enabled={true}
                    renderMode="portal"
                    trigger={
                      <SegmentedControlOption
                        data-testid="search-indexes-tab"
                        value="search-indexes"
                        disabled={true}
                      >
                        Search Indexes
                      </SegmentedControlOption>
                    }
                  >
                    {serverSupportsSearchIndexManagement(serverVersion) ? (
                      <p>
                        Unable to fetch search indexes. This can occur when your
                        cluster does not support search indexes or the request
                        to list search indexes failed.
                      </p>
                    ) : (
                      <>
                        <p>
                          Atlas Search index management in Compass is only
                          available for Atlas local deployments and clusters
                          running MongoDB 6.0.7 or newer.
                        </p>
                        <p>
                          For clusters running an earlier version of MongoDB,
                          you can manage your Atlas Search indexes from the
                          Atlas web Ul, with the CLI, or with the Administration
                          API.
                        </p>
                      </>
                    )}
                  </Tooltip>
                )}
                {isSearchIndexesSupported && (
                  <SegmentedControlOption
                    data-testid="search-indexes-tab"
                    value="search-indexes"
                  >
                    Search Indexes
                  </SegmentedControlOption>
                )}
              </SegmentedControl>
            )}
          </div>
        </div>
      )}
      {isReadonlyView
        ? renderViewBanner(serverVersion, mongoDBMajorVersion)
        : !!errorMessage && (
            <ErrorSummary data-testid="indexes-error" errors={[errorMessage]} />
          )}
    </div>
  );
};

type CreateIndexButtonProps = {
  isSearchManagementActive: boolean;
  isSearchIndexesSupported: boolean;
  isWritable: boolean;
  onCreateRegularIndexClick: () => void;
  onCreateSearchIndexClick: () => void;
};

type CreateIndexActions = 'createRegularIndex' | 'createSearchIndex';

export const CreateIndexButton: React.FunctionComponent<
  CreateIndexButtonProps
> = ({
  isSearchManagementActive,
  isSearchIndexesSupported,
  isWritable,
  onCreateRegularIndexClick,
  onCreateSearchIndexClick,
}) => {
  const onActionDispatch = useCallback(
    (action: CreateIndexActions) => {
      switch (action) {
        case 'createRegularIndex':
          return onCreateRegularIndexClick();
        case 'createSearchIndex':
          return onCreateSearchIndexClick();
      }
    },
    [onCreateRegularIndexClick, onCreateSearchIndexClick]
  );

  if (isSearchIndexesSupported && isSearchManagementActive) {
    return (
      <DropdownMenuButton
        data-testid="multiple-index-types-creation-dropdown"
        buttonText="Create"
        buttonProps={{
          size: 'small',
          variant: 'primary',
          disabled: !isWritable,
        }}
        actions={[
          { action: 'createRegularIndex', label: 'Index' },
          { action: 'createSearchIndex', label: 'Search Index' },
        ]}
        onAction={onActionDispatch}
        hideOnNarrow={false}
      />
    );
  }

  return (
    <Button
      data-testid="open-create-index-modal-button"
      disabled={!isWritable}
      onClick={onCreateRegularIndexClick}
      variant="primary"
      size="small"
    >
      Create Index
    </Button>
  );
};

const mapState = ({
  namespace,
  isWritable,
  isReadonlyView,
  isSearchIndexesSupported,
  description,
  serverVersion,
  searchIndexes,
  indexView,
}: RootState) => ({
  namespace,
  isWritable,
  isReadonlyView,
  isSearchIndexesSupported,
  writeStateDescription: description,
  indexView,
  serverVersion,
  searchIndexes,
});

const mapDispatch = {
  onCreateRegularIndexClick: () => createIndexOpened(),
  onCreateSearchIndexClick: createSearchIndexOpened,
  onIndexViewChanged: indexViewChanged,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(IndexesToolbar, ['readOnly']));
