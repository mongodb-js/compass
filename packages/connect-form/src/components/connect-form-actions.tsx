import React from 'react';
import { ErrorSummary, WarningSummary } from './validation-summary';
import {
  ConnectionFormError,
  ConnectionFormWarning,
} from '../utils/validation';

import { useUiKitContext } from '../contexts/ui-kit-context';

function ConnectFormActions({
  errors,
  warnings,
  onConnectClicked,
}: {
  onConnectClicked: () => void;
  errors: ConnectionFormError[];
  warnings: ConnectionFormWarning[];
}): React.ReactElement {
  const {
    Button,
    ButtonVariant,
    spacing,
    uiColors,
    css,
  } = useUiKitContext();

  const formActionStyles = css({
    borderTop: `1px solid ${uiColors.gray?.light2}`,
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
  });
  
  const formButtonsStyles = css({
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    textAlign: 'right',
  });

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
