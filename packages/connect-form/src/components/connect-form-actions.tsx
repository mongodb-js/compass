import React, { Fragment } from 'react';
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
import type { ConnectionInfo } from 'mongodb-data-service';

const formActionStyles = css({
  borderTop: `1px solid ${uiColors.gray.light2}`,
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
});

const formActionButtonsStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[2],
});

const formButtonsStyles = css({
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
  textAlign: 'right',
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
          <div className={formButtonsStyles}>
            <Button
              variant={ButtonVariant.Default}
              disabled={saveButton === 'disabled'}
              onClick={onSaveClicked}
            >
              Save
            </Button>
          </div>
        )}

        <div className={formButtonsStyles}>
          <Button variant={ButtonVariant.Primary} onClick={onConnectClicked}>
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConnectFormActions;
