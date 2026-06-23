import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { buildAtlasSearchLink } from '@mongodb-js/atlas-service/provider';
import { usePreferences } from 'compass-preferences-model/provider';
import {
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
import { createIndexOpened } from '../../modules/create-index';
import type { IndexView } from '../../modules/index-view';
import { indexViewChanged } from '../../modules/index-view';
import { VIEW_PIPELINE_UTILS } from '@mongodb-js/mongodb-constants';
import { selectIsViewSearchCompatible } from '../../utils/is-view-search-compatible';
import {
  useSearchActivationProgramP1,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';

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
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const alignSelfEndStyles = css({
  marginLeft: 'auto',
});

const spinnerStyles = css({ marginRight: spacing[200] });

const createIndexButtonContainerStyles = css({
  display: 'inline-block',
  width: 'fit-content',
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
  hasSearchIndexes?: boolean;
  isViewPipelineSearchQueryable?: boolean;
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
  hasSearchIndexes = false,
  isViewPipelineSearchQueryable = true,
}) => {
  const {
    readWrite: preferencesReadWrite,
    enableAtlasSearchIndexes,
    showInsights: preferencesShowInsights,
  } = usePreferences(['readWrite', 'enableAtlasSearchIndexes', 'showInsights']);
  const { enableSearchActivationProgramP1 } = useSearchActivationProgramP1();
  const isSearchManagementActive =
    enableAtlasSearchIndexes || enableSearchActivationProgramP1;
  const { atlasMetadata } = useConnectionInfo();
  const track = useTelemetry();
  const showInsights = preferencesShowInsights && !errorMessage;
  const showCreateIndexButton =
    (!isReadonlyView ||
      VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
        serverVersion
      )) &&
    !preferencesReadWrite &&
    !errorMessage;
  const refreshButtonIcon = isRefreshing ? (
    <div className={spinnerStyles}>
      <SpinLoader title="Refreshing Indexes" />
    </div>
  ) : (
    <Icon glyph="Refresh" title="Refresh Indexes" />
  );

  const isVersionCompatible =
    VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(serverVersion);
  const isIncompatibleViewWithExistingIndexes =
    !isViewPipelineSearchQueryable && !!atlasMetadata && hasSearchIndexes;
  const canManageSearchIndexesOnView =
    isVersionCompatible &&
    isSearchManagementActive &&
    (isViewPipelineSearchQueryable || isIncompatibleViewWithExistingIndexes);
  const showToolbarButtons = !isReadonlyView || canManageSearchIndexesOnView;
  const pipelineNotSearchQueryableDescription =
    'Search indexes can only be created on views containing $match stages with the $expr operator, $addFields, or $set';

  return (
    <div
      className={indexesToolbarContainerStyles}
      data-testid="indexes-toolbar-container"
    >
      {showToolbarButtons && (
        <div data-testid="indexes-toolbar">
          <div className={toolbarButtonsContainer}>
            {showCreateIndexButton && (
              <Tooltip
                enabled={!isWritable || !isViewPipelineSearchQueryable}
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
                      isReadonlyView={isReadonlyView}
                      indexView={indexView}
                      isViewPipelineSearchQueryable={
                        isViewPipelineSearchQueryable
                      }
                    />
                  </div>
                }
              >
                {(!isWritable && writeStateDescription) ||
                  (!isViewPipelineSearchQueryable &&
                    pipelineNotSearchQueryableDescription)}
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
                href={buildAtlasSearchLink({
                  atlasMetadata,
                  namespace,
                })}
                onClick={() => {
                  track('Manage Search Indexes Link Clicked', {
                    context: 'Indexes Tab',
                  });
                }}
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
                {isReadonlyView && (
                  <Tooltip
                    align="top"
                    justify="end"
                    enabled={true}
                    renderMode="portal"
                    trigger={
                      <SegmentedControlOption
                        data-testid="regular-indexes-tab"
                        value="regular-indexes"
                        disabled={isReadonlyView}
                      >
                        Indexes
                      </SegmentedControlOption>
                    }
                  >
                    Readonly views may not contain standard indexes.
                  </Tooltip>
                )}
                {!isReadonlyView && (
                  <SegmentedControlOption
                    data-testid="regular-indexes-tab"
                    value="regular-indexes"
                  >
                    Indexes
                  </SegmentedControlOption>
                )}
                {!isSearchIndexesSupported && !isReadonlyView && (
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
                {(isSearchIndexesSupported || isReadonlyView) && (
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
      {!!errorMessage && (
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
  isReadonlyView: boolean;
  indexView: IndexView;
  isViewPipelineSearchQueryable: boolean;
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
  isReadonlyView,
  indexView,
  isViewPipelineSearchQueryable,
}) => {
  const track = useTelemetry();

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

  if (isReadonlyView && isSearchManagementActive) {
    if (indexView === 'search-indexes') {
      return (
        <Button
          disabled={!isWritable || !isViewPipelineSearchQueryable}
          onClick={() => {
            onCreateSearchIndexClick();
            track('Create Search Index for View Clicked', {
              context: 'Indexes Tab',
            });
          }}
          variant="primary"
          size="small"
        >
          Create Search Index
        </Button>
      );
    }

    return null;
  }
  if (!isReadonlyView && isSearchIndexesSupported && isSearchManagementActive) {
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

const mapState = (state: RootState) => {
  const { isViewPipelineSearchQueryable } = selectIsViewSearchCompatible(state);
  const {
    namespace,
    isWritable,
    isReadonlyView,
    isSearchIndexesSupported,
    description,
    serverVersion,
    searchIndexes,
    indexView,
  } = state;
  return {
    namespace,
    isWritable,
    isReadonlyView,
    isSearchIndexesSupported,
    writeStateDescription: description,
    indexView,
    serverVersion,
    hasSearchIndexes: searchIndexes.indexes.length > 0,
    isViewPipelineSearchQueryable,
  };
};

const mapDispatch = {
  onCreateRegularIndexClick: () => createIndexOpened(),
  onCreateSearchIndexClick: createSearchIndexOpened,
  onIndexViewChanged: indexViewChanged,
};

export default connect(mapState, mapDispatch)(IndexesToolbar);
