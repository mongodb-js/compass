import React from 'react';
import {
  Button,
  type ItemComponentProps,
} from '@mongodb-js/compass-components';
import type { Actions } from './constants';
import { usePreference } from 'compass-preferences-model/provider';
import { ConnectButtonWithMenu } from './connect-button-with-menu';

export function ConnectButton(props: ItemComponentProps<Actions>) {
  const connectInNewWindowEnabled = usePreference('enableConnectInNewWindow');
  if (connectInNewWindowEnabled) {
    return <ConnectButtonWithMenu {...props} />;
  } else {
    const {
      action,
      tooltip,
      label,
      iconSize,
      iconStyle,
      isDisabled,
      onClick,
      className,
      'data-testid': testId,
    } = props;
    return (
      <Button
        key={action}
        title={!tooltip ? label : undefined}
        size={iconSize}
        data-action={action}
        data-testid={testId}
        onClick={onClick}
        className={className}
        style={iconStyle}
        disabled={isDisabled}
      >
        {label}
      </Button>
    );
  }
}
