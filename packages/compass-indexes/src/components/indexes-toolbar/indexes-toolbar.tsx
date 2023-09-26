import React, { useCallback, useEffect, useState } from 'react';
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

export type IndexView = 'regular-indexes' | 'search-indexes';

type IndexesToolbarProps = {
  // passed props:
  initialIndexView: IndexView;
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
  initialIndexView,
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
  const [currentIndexView, setCurrentIndexView] =
    useState<IndexView>(initialIndexView);

  useEffect(() => {
    setCurrentIndexView(initialIndexView);
  }, [initialIndexView]);

  const isSearchManagementActive = usePreference(
    'enableAtlasSearchIndexManagement',
    React
  );

  const showInsights = usePreference('showInsights', React) && !errorMessage;

  const onChangeIndexesSegment = useCallback(
    (value: string) => {
      const newView = value as IndexView;

      setCurrentIndexView(newView);
      onChangeIndexView(newView);
    },
    [onChangeIndexView]
  );

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
                onChange={onChangeIndexesSegment}
                className={alignSelfEndStyles}
                label="Viewing"
                value={currentIndexView}
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
                    Search indexes are unavailable in your current connection.
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
}: RootState) => ({
  isWritable,
  isReadonlyView,
  writeStateDescription: description,
  serverVersion,
  isAtlasSearchSupported:
    searchIndexes.status !== SearchIndexesStatuses.NOT_AVAILABLE,
});

const mapDispatch = {
  onCreateRegularIndex,
  onCreateSearchIndex,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(IndexesToolbar, ['readOnly'], React));
