import React, { useCallback } from 'react';
import {
  Button,
  Toolbar,
  css,
  spacing,
  WarningSummary,
  ErrorSummary,
} from '@mongodb-js/compass-components';
import type AppRegistry from 'hadron-app-registry';

const toolbarStyles = css({
  padding: spacing[3],
});

type IndexesToolbarProps = {
  errorMessage?: string;
  isReadonly: boolean;
  isReadonlyView: boolean;
  isWritable: boolean;
  localAppRegistry: AppRegistry;
};

export const IndexesToolbar: React.FunctionComponent<IndexesToolbarProps> = ({
  errorMessage,
  isReadonly,
  isReadonlyView,
  isWritable,
  localAppRegistry,
}) => {
  const onClickCreateIndex = useCallback(() => {
    localAppRegistry.emit('toggle-create-index-modal', true);
  }, [localAppRegistry]);

  const showCreateIndexButton = !isReadonly && !isReadonlyView && !errorMessage;

  return (
    <Toolbar className={toolbarStyles}>
      {showCreateIndexButton ? (
        <Button
          data-testid="open-create-index-modal-button"
          disabled={!isWritable}
          onClick={onClickCreateIndex}
          variant="primary"
          size="small"
        >
          Create Index
        </Button>
      ) : (
        <div data-test-id="indexes-toolbar-empty" />
      )}
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
