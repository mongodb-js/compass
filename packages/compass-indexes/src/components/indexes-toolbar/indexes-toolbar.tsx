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
} from '@mongodb-js/compass-components';
import type AppRegistry from 'hadron-app-registry';

const toolbarStyles = css({
  padding: spacing[2],
  backgroundColor: 'transparent',
});

const toolbarButtonsContainer = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
  justifyContent: 'flex-end',
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
  preferencesReadOnly: boolean;
  isWritable: boolean;
  localAppRegistry: AppRegistry;
  isRefreshing: boolean;
  writeStateDescription?: string;
  onRefreshIndexes: () => void;
};

export const IndexesToolbar: React.FunctionComponent<IndexesToolbarProps> = ({
  errorMessage,
  isReadonly,
  isReadonlyView,
  preferencesReadOnly,
  isWritable,
  localAppRegistry,
  isRefreshing,
  writeStateDescription,
  onRefreshIndexes,
}) => {
  const onClickCreateIndex = useCallback(() => {
    localAppRegistry.emit('toggle-create-index-modal', true);
  }, [localAppRegistry]);
  const showCreateIndexButton =
    !isReadonly && !isReadonlyView && !preferencesReadOnly && !errorMessage;
  const refreshButtonIcon = isRefreshing ? (
    <div className={spinnerStyles}>
      <SpinLoader title="Refreshing Indexes" />
    </div>
  ) : (
    <Icon glyph="Refresh" title="Refresh Indexes" />
  );

  return (
    <div className={toolbarStyles} data-testid="indexes-toolbar">
      <div className={toolbarButtonsContainer}>
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
                <Button
                  data-testid="open-create-index-modal-button"
                  disabled={!isWritable}
                  onClick={onClickCreateIndex}
                  variant="primary"
                  size="small"
                >
                  Create Index
                </Button>
                {children}
              </div>
            )}
          >
            {writeStateDescription}
          </Tooltip>
        )}
      </div>
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
