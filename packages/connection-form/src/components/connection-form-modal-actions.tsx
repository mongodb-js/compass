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
import { useConnectionFormSetting } from '../hooks/use-connect-form-settings';

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

export type ConnectionFormModalActionsProps = {
  errors: ConnectionFormError[];
  warnings: ConnectionFormWarning[];

  onCancel?(): void;
  onSave?(): void;
  onSaveAndConnect?(): void;
  onConnect?(): void;
};

export function ConnectionFormModalActions({
  errors,
  warnings,
  onCancel,
  onSave,
  onSaveAndConnect,
  onConnect,
}: ConnectionFormModalActionsProps): React.ReactElement {
  const saveAndConnectLabel = useConnectionFormSetting('saveAndConnectLabel');
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

        {onSave && (
          <div className={saveAndConnectStyles}>
            <Button
              data-testid="save-button"
              variant={
                onSaveAndConnect
                  ? ButtonVariant.PrimaryOutline
                  : ButtonVariant.Primary
              }
              disabled={false}
              onClick={onSave}
            >
              Save
            </Button>
          </div>
        )}

        {onConnect && (
          <Button
            data-testid={'connect-button'}
            variant={ButtonVariant.PrimaryOutline}
            onClick={onConnect}
          >
            Connect
          </Button>
        )}

        {onSaveAndConnect && (
          <Button
            data-testid={
              onConnect ? 'save-and-connect-button' : 'connect-button'
            }
            variant={ButtonVariant.Primary}
            onClick={onSaveAndConnect}
          >
            {saveAndConnectLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
