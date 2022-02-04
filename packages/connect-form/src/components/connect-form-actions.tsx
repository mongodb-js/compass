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

const formButtonsStyles = css({
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
  textAlign: 'right',
});

function ConnectFormActions({
  errors,
  warnings,
  onConnectClicked,
}: {
  onConnectClicked: () => void;
  errors: ConnectionFormError[];
  warnings: ConnectionFormWarning[];
}): React.ReactElement {
  return (
    <div className={formActionStyles}>
      {warnings.length ? <WarningSummary warnings={warnings} /> : ''}
      {errors.length ? <ErrorSummary errors={errors} /> : ''}

      <div className={formButtonsStyles}>
        <Button variant={ButtonVariant.Primary} onClick={onConnectClicked}>
          Connect
        </Button>
      </div>
    </div>
  );
}

export default ConnectFormActions;
