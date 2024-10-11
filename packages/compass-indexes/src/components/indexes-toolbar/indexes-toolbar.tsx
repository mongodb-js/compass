import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
  withPreferences,
  usePreference,
} from 'compass-preferences-model/provider';
import {
  Button,
  ErrorSummary,
  Tooltip,
  WarningSummary,
  css,
  spacing,
  Icon,
  SpinLoader,
  SignalPopover,
  PerformanceSignals,
  DropdownMenuButton,
  SegmentedControl,
  SegmentedControlOption,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { createSearchIndexOpened } from '../../modules/search-indexes';
import { createIndexOpened } from '../../modules/create-index';
import type { IndexView } from '../../modules/index-view';
import { indexViewChanged } from '../../modules/index-view';

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
  onIndexViewChanged: (newView: IndexView) => void;
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
  indexView,
  errorMessage,
  isReadonlyView,
  isWritable,
  onCreateRegularIndexClick,
  onCreateSearchIndexClick,
  isRefreshing,
  writeStateDescription,
  hasTooManyIndexes,
  isSearchIndexesSupported,
  onRefreshIndexes,
  onIndexViewChanged,
  readOnly, // preferences readOnly.
}) => {
  const isSearchManagementActive = usePreference('enableAtlasSearchIndexes');
  const showInsights = usePreference('showInsights') && !errorMessage;
  const showCreateIndexButton = !isReadonlyView && !readOnly && !errorMessage;
  const refreshButtonIcon = isRefreshing ? (
    <div className={spinnerStyles}>
      <SpinLoader title="Refreshing Indexes" />
    </div>
  ) : (
    <Icon glyph="Refresh" title="Refresh Indexes" />
  );

  return (
    <div data-testid="indexes-toolbar-container">
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
                    justify="middle"
                    enabled={true}
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
                    <p>
                      Atlas Search index management in Compass is only available
                      for Atlas local deployments and clusters running MongoDB
                      6.0.7 or newer.
                    </p>
                    <p>
                      For clusters running an earlier version of MongoDB, you
                      can manage your Atlas Search indexes from the Atlas web
                      Ul, with the CLI, or with the Administration API.
                    </p>
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
      {isReadonlyView ? (
        <WarningSummary
          warnings={['Readonly views may not contain indexes.']}
        />
      ) : (
        !!errorMessage && (
          <ErrorSummary data-testid="indexes-error" errors={[errorMessage]} />
        )
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
  isWritable,
  isReadonlyView,
  isSearchIndexesSupported,
  description,
  serverVersion,
  searchIndexes,
  indexView,
}: RootState) => ({
  isWritable,
  isReadonlyView,
  isSearchIndexesSupported,
  writeStateDescription: description,
  indexView,
  serverVersion,
  searchIndexes,
});

const mapDispatch = {
  onCreateRegularIndexClick: createIndexOpened,
  onCreateSearchIndexClick: createSearchIndexOpened,
  onIndexViewChanged: indexViewChanged,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(IndexesToolbar, ['readOnly']));
