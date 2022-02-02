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
import { ConnectionInfo } from 'mongodb-data-service';

const formActionStyles = css({
  borderTop: `1px solid ${uiColors.gray.light2}`,
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
});

const formActionButtonStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  '& div:first-child': {
    marginRight: spacing[2],
  },
});

const formButtonsStyles = css({
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
  textAlign: 'right',
});

function ConnectFormActions({
  initialConnectionInfo,
  errors,
  warnings,
  onConnectClicked,
  onSaveClicked,
  saveDisabled,
}: {
  initialConnectionInfo: ConnectionInfo;
  errors: ConnectionFormError[];
  warnings: ConnectionFormWarning[];
  onConnectClicked: () => void;
  onSaveClicked: () => void;
  saveDisabled: boolean;
}): React.ReactElement {
  return (
    <div className={formActionStyles}>
      {warnings.length ? <WarningSummary warnings={warnings} /> : ''}
      {errors.length ? <ErrorSummary errors={errors} /> : ''}
      <div className={formActionButtonStyles}>
        {!initialConnectionInfo.favorite && (
          <div className={formButtonsStyles}>
            <Button variant={ButtonVariant.Primary} onClick={onConnectClicked}>
              Connect
            </Button>
          </div>
        )}
        {!!initialConnectionInfo.favorite && (
          <Fragment>
            <div className={formButtonsStyles}>
              <Button
                variant={ButtonVariant.Default}
                disabled={saveDisabled}
                onClick={onSaveClicked}
              >
                Save
              </Button>
            </div>
            <div className={formButtonsStyles}>
              <Button
                variant={ButtonVariant.Primary}
                onClick={onConnectClicked}
              >
                Connect
              </Button>
            </div>
          </Fragment>
        )}
      </div>
    </div>
  );
}

export default ConnectFormActions;
