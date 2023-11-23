import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { withPreferences } from 'compass-preferences-model';
import {
  Button,
  ErrorSummary,
  Tooltip,
  WarningSummary,
  css,
  mergeProps,
  spacing,
  Icon,
  SpinLoader,
  SignalPopover,
  PerformanceSignals,
  DropdownMenuButton,
  SegmentedControl,
  SegmentedControlOption,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model';

import type { RootState } from '../../modules';
import {
  SearchIndexesStatuses,
  showCreateModal as onCreateSearchIndex,
} from '../../modules/search-indexes';
import { showCreateModal as onCreateRegularIndex } from '../../modules/regular-indexes';
import type { IndexView } from '../../modules/index-view';
import { changeIndexView } from '../../modules/index-view';

const containerStyles = css({
  margin: `${spacing[3]}px 0`,
});

const toolbarButtonsContainer = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
  justifyContent: 'flex-start',
  alignItems: 'center',
});

const alignSelfEndStyles = css({
  marginLeft: 'auto',
});

const errorStyles = css({ marginTop: spacing[2] });
const spinnerStyles = css({ marginRight: spacing[2] });

const createIndexButtonContainerStyles = css({
  display: 'inline-block',
  width: 'fit-content',
});

type IndexesToolbarProps = {
  indexView: IndexView;
  errorMessage: string | null;
  hasTooManyIndexes: boolean;
  isRefreshing: boolean;
  onRefreshIndexes: () => void;
  onChangeIndexView: (newView: IndexView) => void;
  // connected:
  isReadonlyView: boolean;
  isWritable: boolean;
  onCreateRegularIndex: () => void;
  onCreateSearchIndex: () => void;
  writeStateDescription?: string;
  isAtlasSearchSupported: boolean;
  // via withPreferences:
  readOnly?: boolean;
};

export const IndexesToolbar: React.FunctionComponent<IndexesToolbarProps> = ({
  indexView,
  errorMessage,
  isReadonlyView,
  isWritable,
  onCreateRegularIndex,
  onCreateSearchIndex,
  isRefreshing,
  writeStateDescription,
  hasTooManyIndexes,
  isAtlasSearchSupported,
  onRefreshIndexes,
  onChangeIndexView,
  readOnly, // preferences readOnly.
}) => {
  const isSearchManagementActive = usePreference(
    'enableAtlasSearchIndexManagement',
    React
  );

  const showInsights = usePreference('showInsights', React) && !errorMessage;
  const showCreateIndexButton = !isReadonlyView && !readOnly && !errorMessage;
  const refreshButtonIcon = isRefreshing ? (
    <div className={spinnerStyles}>
      <SpinLoader title="Refreshing Indexes" />
    </div>
  ) : (
    <Icon glyph="Refresh" title="Refresh Indexes" />
  );

  return (
    <div className={containerStyles} data-testid="indexes-toolbar-container">
      {!isReadonlyView && (
        <div data-testid="indexes-toolbar">
          <div className={toolbarButtonsContainer}>
            {showCreateIndexButton && (
              <Tooltip
                enabled={!isWritable}
                align="top"
                justify="middle"
                trigger={({ children, ...props }) => (
                  <div
                    {...mergeProps(
                      {
                        className: createIndexButtonContainerStyles,
                      },
                      props
                    )}
                  >
                    <CreateIndexButton
                      isSearchManagementActive={isSearchManagementActive}
                      isAtlasSearchSupported={isAtlasSearchSupported}
                      isWritable={isWritable}
                      onCreateRegularIndex={onCreateRegularIndex}
                      onCreateSearchIndex={onCreateSearchIndex}
                    ></CreateIndexButton>
                    {children}
                  </div>
                )}
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
            {showInsights && hasTooManyIndexes && (
              <SignalPopover
                signals={PerformanceSignals.get('too-many-indexes')}
              />
            )}
            {isSearchManagementActive && (
              <SegmentedControl
                size="small"
                onChange={(evt) => onChangeIndexView(evt as IndexView)}
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
                {!isAtlasSearchSupported && (
                  <Tooltip
                    align="top"
                    justify="middle"
                    enabled={true}
                    delay={500}
                    trigger={({ children, ...props }) => (
                      <SegmentedControlOption
                        {...props}
                        data-testid="search-indexes-tab"
                        value="search-indexes"
                        disabled={true}
                      >
                        Search Indexes
                        {children}
                      </SegmentedControlOption>
                    )}
                  >
                    <p>
                      The Atlas Search index management in Compass is only
                      available for Atlas local deployments and M10+ clusters
                      running MongoDB 6.0.7 or newer.
                    </p>
                    <p>
                      For clusters running an earlier version of MongoDB or
                      shared tier clusters you can manage your Atlas Search
                      indexes from the Atlas web UI, with the CLI, or with the
                      Administration API.
                    </p>
                  </Tooltip>
                )}
                {isAtlasSearchSupported && (
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
      {isReadonlyView ? (
        <WarningSummary
          className={errorStyles}
          warnings={['Readonly views may not contain indexes.']}
        />
      ) : (
        !!errorMessage && (
          <ErrorSummary className={errorStyles} errors={[errorMessage]} />
        )
      )}
    </div>
  );
};

type CreateIndexButtonProps = {
  isSearchManagementActive: boolean;
  isAtlasSearchSupported: boolean;
  isWritable: boolean;
  onCreateRegularIndex: () => void;
  onCreateSearchIndex: () => void;
};

type CreateIndexActions = 'createRegularIndex' | 'createSearchIndex';

export const CreateIndexButton: React.FunctionComponent<
  CreateIndexButtonProps
> = ({
  isSearchManagementActive,
  isAtlasSearchSupported,
  isWritable,
  onCreateRegularIndex,
  onCreateSearchIndex,
}) => {
  const onActionDispatch = useCallback(
    (action: CreateIndexActions) => {
      switch (action) {
        case 'createRegularIndex':
          return onCreateRegularIndex();
        case 'createSearchIndex':
          return onCreateSearchIndex();
      }
    },
    [onCreateRegularIndex, onCreateSearchIndex]
  );

  if (isAtlasSearchSupported && isSearchManagementActive) {
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
      />
    );
  }

  return (
    <Button
      data-testid="open-create-index-modal-button"
      disabled={!isWritable}
      onClick={onCreateRegularIndex}
      variant="primary"
      size="small"
    >
      Create Index
    </Button>
  );
};

const mapState = ({
  isWritable,
  isReadonlyView,
  description,
  serverVersion,
  searchIndexes,
  indexView,
}: RootState) => ({
  isWritable,
  isReadonlyView,
  writeStateDescription: description,
  indexView,
  serverVersion,
  isAtlasSearchSupported:
    searchIndexes.status !== SearchIndexesStatuses.NOT_AVAILABLE,
});

const mapDispatch = {
  onCreateRegularIndex,
  onCreateSearchIndex,
  onChangeIndexView: changeIndexView,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(IndexesToolbar, ['readOnly'], React));
