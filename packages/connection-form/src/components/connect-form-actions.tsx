import React from 'react';
import {
  Button,
  ButtonVariant,
  spacing,
  uiColors,
  css,
} from '@mongodb-js/compass-components';
import { ErrorSummary, WarningSummary } from './validation-summary';
import type {
  ConnectionFormError,
  ConnectionFormWarning,
} from '../utils/validation';

const formActionStyles = css({
  borderTop: `1px solid ${uiColors.gray.light2}`,
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
});

const formActionButtonsStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[2],
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
});

function ConnectFormActions({
  errors,
  warnings,
  onConnectClicked,
  onSaveClicked,
  saveButton,
}: {
  errors: ConnectionFormError[];
  warnings: ConnectionFormWarning[];
  onConnectClicked: () => void;
  onSaveClicked: () => void;
  saveButton: 'enabled' | 'disabled' | 'hidden';
}): React.ReactElement {
  return (
    <div className={formActionStyles}>
      {warnings.length ? <WarningSummary warnings={warnings} /> : ''}
      {errors.length ? <ErrorSummary errors={errors} /> : ''}
      <div className={formActionButtonsStyles}>
        {saveButton !== 'hidden' && (
          <Button
            variant={ButtonVariant.Default}
            disabled={saveButton === 'disabled'}
            onClick={onSaveClicked}
          >
            Save
          </Button>
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
