import React, { useCallback } from 'react';
import {
  Button,
  ErrorSummary,
  Toolbar,
  Tooltip,
  WarningSummary,
  css,
  mergeProps,
  spacing,
} from '@mongodb-js/compass-components';
import type AppRegistry from 'hadron-app-registry';

const toolbarStyles = css({
  padding: spacing[3],
  backgroundColor: 'transparent',
});

const toolbarButtonsContainer = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
  justifyContent: 'flex-end',
});

const createIndexButtonContainerStyles = css({
  display: 'inline-block',
  width: 'fit-content',
});

type IndexesToolbarProps = {
  errorMessage?: string;
  isReadonly: boolean;
  isReadonlyView: boolean;
  isWritable: boolean;
  localAppRegistry: AppRegistry;
  writeStateDescription?: string;
};

export const IndexesToolbar: React.FunctionComponent<IndexesToolbarProps> = ({
  errorMessage,
  isReadonly,
  isReadonlyView,
  isWritable,
  localAppRegistry,
  writeStateDescription,
}) => {
  const onClickCreateIndex = useCallback(() => {
    localAppRegistry.emit('toggle-create-index-modal', true);
  }, [localAppRegistry]);

  const showCreateIndexButton = !isReadonly && !isReadonlyView && !errorMessage;

  return (
    <Toolbar className={toolbarStyles} data-testid="indexes-toolbar">
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
          warnings={['Readonly views may not contain indexes.']}
        />
      ) : (
        !!errorMessage && <ErrorSummary errors={[errorMessage]} />
      )}
    </Toolbar>
  );
};
