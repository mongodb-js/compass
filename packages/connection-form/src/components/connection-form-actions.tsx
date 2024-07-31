import React from 'react';
import {
  Button,
  ButtonVariant,
  ErrorSummary,
  WarningSummary,
  spacing,
  css,
  cx,
} from '@mongodb-js/compass-components';
import type {
  ConnectionFormError,
  ConnectionFormWarning,
} from '../utils/validation';
import { useConnectionFormPreference } from '../hooks/use-connect-form-preferences';

const formActionStyles = css({
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

export function LegacyConnectionFormActions({
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
  const showFavoriteActions = useConnectionFormPreference(
    'showFavoriteActions'
  );

  return (
    <div className={cx(formActionStyles)}>
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
        {showFavoriteActions && (
          <>
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
          </>
        )}

        <Button
          data-testid="connect-button"
          variant={ButtonVariant.Primary}
          onClick={onConnectClicked}
        >
          {showFavoriteActions ? 'Connect' : 'Save & Connect'}
        </Button>
      </div>
    </div>
  );
}

export type ConnectionFormModalActionsProps = {
  errors: ConnectionFormError[];
  warnings: ConnectionFormWarning[];

  onCancel?(): void;
  onSave(): void;
  onSaveAndConnect(): void;
};

// TODO(COMPASS-8098): Make sure these work for VSCode, for example add:
// saveButton: 'enabled' | 'disabled' | 'hidden';
// saveAndConnectButton: 'enabled' | 'disabled' | 'hidden';
// cancelButton: 'enabled' | 'disabled' | 'hidden';
export function ConnectionFormModalActions({
  errors,
  warnings,
  onCancel,
  onSave,
  onSaveAndConnect,
}: ConnectionFormModalActionsProps): React.ReactElement {
  return (
    <div className={cx(formActionStyles)}>
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
        {onCancel && (
          <Button
            data-testid="cancel-button"
            variant={ButtonVariant.Default}
            disabled={false}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}

        <div className={saveAndConnectStyles}>
          <Button
            data-testid="save-button"
            variant={ButtonVariant.PrimaryOutline}
            disabled={false}
            onClick={onSave}
          >
            Save
          </Button>
        </div>

        <Button
          data-testid="connect-button"
          variant={ButtonVariant.Primary}
          onClick={onSaveAndConnect}
        >
          Save &amp; Connect
        </Button>
      </div>
    </div>
  );
}
