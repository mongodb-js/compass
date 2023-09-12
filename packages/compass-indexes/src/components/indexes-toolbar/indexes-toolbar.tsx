import React, { useCallback } from 'react';
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
import type AppRegistry from 'hadron-app-registry';
import { usePreference } from 'compass-preferences-model';

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
  errorMessage: string | null;
  isReadonlyView: boolean;
  isWritable: boolean;
  hasTooManyIndexes: boolean;
  localAppRegistry: AppRegistry;
  isRefreshing: boolean;
  writeStateDescription?: string;
  isAtlasSearchSupported: boolean;
  onRefreshIndexes: () => void;
  onChangeIndexView: (newView: IndexView) => void;
  onClickCreateAtlasSearchIndex: () => void;
  readOnly?: boolean;
};

export const IndexesToolbar: React.FunctionComponent<IndexesToolbarProps> = ({
  errorMessage,
  isReadonlyView,
  isWritable,
  localAppRegistry,
  isRefreshing,
  writeStateDescription,
  hasTooManyIndexes,
  isAtlasSearchSupported,
  onRefreshIndexes,
  onChangeIndexView,
  readOnly, // preferences readOnly.
  onClickCreateAtlasSearchIndex,
}) => {
  const isSearchManagementActive = usePreference(
    'enableAtlasSearchIndexManagement',
    React
  );

  const showInsights = usePreference('showInsights', React) && !errorMessage;
  const onClickCreateIndex = useCallback(() => {
    localAppRegistry.emit('open-create-index-modal');
  }, [localAppRegistry]);
  const onChangeIndexesSegment = useCallback(
    (value: string) => {
      const newView = value as IndexView;
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
    <div className={containerStyles}>
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
                      onClickCreateIndex={onClickCreateIndex}
                      onClickCreateAtlasSearchIndex={
                        onClickCreateAtlasSearchIndex
                      }
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
                defaultValue="regular-indexes"
              >
                <SegmentedControlOption value="regular-indexes">
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
                  <SegmentedControlOption value="search-indexes">
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
  onClickCreateIndex: () => void;
  onClickCreateAtlasSearchIndex: () => void;
};

type CreateIndexActions = 'createRegularIndex' | 'createSearchIndex';

export const CreateIndexButton: React.FunctionComponent<
  CreateIndexButtonProps
> = ({
  isSearchManagementActive,
  isAtlasSearchSupported,
  isWritable,
  onClickCreateIndex,
  onClickCreateAtlasSearchIndex,
}) => {
  const onActionDispatch = useCallback(
    (action: CreateIndexActions) => {
      switch (action) {
        case 'createRegularIndex':
          return onClickCreateIndex();
        case 'createSearchIndex':
          return onClickCreateAtlasSearchIndex();
      }
    },
    [onClickCreateIndex, onClickCreateAtlasSearchIndex]
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
      onClick={onClickCreateIndex}
      variant="primary"
      size="small"
    >
      Create Index
    </Button>
  );
};
