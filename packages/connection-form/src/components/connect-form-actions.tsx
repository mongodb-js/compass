import React from 'react';
import {
  Button,
  ButtonVariant,
  ErrorSummary,
  WarningSummary,
  spacing,
  palette,
  css,
  cx,
} from '@mongodb-js/compass-components';
import type {
  ConnectionFormError,
  ConnectionFormWarning,
} from '../utils/validation';

const formActionStyles = css({
  borderTop: `1px solid ${palette.gray.light2}`,
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
});

const formActionItemStyles = css({
  marginTop: spacing[3],
  '&:last-child': {
    marginBottom: spacing[3],
  },
});

const formActionButtonsStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[2],
});

const saveAndConnectStyles = css({
  flexGrow: 1,
  display: 'flex',
  justifyContent: 'flex-end',
});

function ConnectFormActions({
  errors,
  warnings,
  onConnectClicked,
  onSaveClicked,
  onSaveAndConnectClicked,
  saveButton,
  saveAndConnectButton,
}: {
  errors: ConnectionFormError[];
  warnings: ConnectionFormWarning[];
  onConnectClicked: () => void;
  onSaveClicked: () => void;
  onSaveAndConnectClicked: () => void;
  saveButton: 'enabled' | 'disabled' | 'hidden';
  saveAndConnectButton: 'enabled' | 'disabled' | 'hidden';
}): React.ReactElement {
  return (
    <div className={formActionStyles}>
      {warnings.length > 0 && (
        <div className={formActionItemStyles}>
          <WarningSummary
            data-testid="connection-warnings-summary"
            warnings={warnings.map((warning) => warning.message)}
          />
        </div>
      )}
      {errors.length > 0 && (
        <div className={formActionItemStyles}>
          <ErrorSummary
            data-testid="connection-error-summary"
            errors={errors.map((error) => error.message)}
          />
        </div>
      )}
      <div className={cx(formActionItemStyles, formActionButtonsStyles)}>
        {saveButton !== 'hidden' && (
          <Button
            data-testid="save-connection-button"
            variant={ButtonVariant.Default}
            disabled={saveButton === 'disabled'}
            onClick={onSaveClicked}
          >
            Save
          </Button>
        )}

        {saveAndConnectButton !== 'hidden' && (
          <div className={saveAndConnectStyles}>
            <Button
              data-testid="save-and-connect-button"
              variant={ButtonVariant.PrimaryOutline}
              disabled={saveAndConnectButton === 'disabled'}
              onClick={onSaveAndConnectClicked}
            >
              Save &amp; Connect
            </Button>
          </div>
        )}

        <Button
          data-testid="connect-button"
          variant={ButtonVariant.Primary}
          onClick={onConnectClicked}
        >
          Connect
        </Button>
      </div>
    </div>
  );
}

export default ConnectFormActions;
