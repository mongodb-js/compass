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
  MenuItem,
  SplitButton,
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

const errorStyles = css({ marginTop: spacing[2] });
const spinnerStyles = css({ marginRight: spacing[2] });

const createIndexButtonContainerStyles = css({
  display: 'inline-block',
  width: 'fit-content',
});

type IndexesToolbarProps = {
  errorMessage: string | null;
  isReadonly: boolean;
  isReadonlyView: boolean;
  isWritable: boolean;
  hasTooManyIndexes: boolean;
  localAppRegistry: AppRegistry;
  isRefreshing: boolean;
  writeStateDescription?: string;
  isAtlasSearchAvailable: boolean;
  onRefreshIndexes: () => void;
  readOnly?: boolean;
};

export const IndexesToolbar: React.FunctionComponent<IndexesToolbarProps> = ({
  errorMessage,
  isReadonly,
  isReadonlyView,
  isWritable,
  localAppRegistry,
  isRefreshing,
  writeStateDescription,
  hasTooManyIndexes,
  isAtlasSearchAvailable,
  onRefreshIndexes,
  readOnly, // preferences readOnly.
}) => {
  const isSearchManagementActive = usePreference(
    'enableAtlasSearchIndexManagement',
    React
  );
  const isAtlasSearchOptionEnabled =
    isSearchManagementActive && isAtlasSearchAvailable;

  const showInsights = usePreference('showInsights', React) && !errorMessage;
  const onClickCreateIndex = useCallback(() => {
    localAppRegistry.emit('open-create-index-modal');
  }, [localAppRegistry]);
  const onClickCreateAtlasSearchIndex = useCallback(() => {
    localAppRegistry.emit('open-create-search-index-modal');
  }, [localAppRegistry]);
  const showCreateIndexButton =
    !isReadonly && !isReadonlyView && !readOnly && !errorMessage;
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
                      isAtlasSearchAvailable={isAtlasSearchAvailable}
                      isAtlasSearchOptionEnabled={isAtlasSearchOptionEnabled}
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
  isAtlasSearchAvailable: boolean;
  isAtlasSearchOptionEnabled: boolean;
  isWritable: boolean;
  onClickCreateIndex: () => void;
  onClickCreateAtlasSearchIndex: () => void;
};

export const CreateIndexButton: React.FunctionComponent<
  CreateIndexButtonProps
> = ({
  isAtlasSearchAvailable,
  isAtlasSearchOptionEnabled,
  isWritable,
  onClickCreateIndex,
  onClickCreateAtlasSearchIndex,
}) => {
  if (!isAtlasSearchAvailable) {
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
  }

  return (
    <SplitButton
      label="Create"
      variant="primary"
      menuItems={[
        <MenuItem key="0" disabled={!isWritable} onClick={onClickCreateIndex}>
          Index
        </MenuItem>,
        <MenuItem
          key="1"
          disabled={!isWritable || !isAtlasSearchOptionEnabled}
          onClick={onClickCreateAtlasSearchIndex}
        >
          Search Index
        </MenuItem>,
      ]}
    ></SplitButton>
  );
};
