import React from 'react';
import { ServerIcon } from '@mongodb-js/compass-components';
import type { ToolState } from '../utils';
import type { BasicConnectionInfo } from '../compass-assistant-provider';
import { ActionCardMessage } from './action-card-message';

interface AtlasToolCallMessageProps {
  state: 'confirmed' | 'rejected' | 'pending';
  /** Whether there is already an Atlas sign-in. When true, the primary action
   *  runs the debug tool directly ("Run") instead of prompting to connect. */
  isUserSignedIn: boolean;
  description: string;
  connectionInfo: BasicConnectionInfo | null;
  onConfirm: () => void;
  onReject: () => void;
}

function getTitle(
  state: AtlasToolCallMessageProps['state'],
  isUserSignedIn: boolean
): string {
  switch (state) {
    case 'confirmed':
      return 'Connected to Atlas';
    case 'rejected':
      return 'Cancelled Atlas Connection';
    default:
      return isUserSignedIn
        ? 'Run Atlas to debug this connection'
        : 'Connect with Atlas to debug this connection';
  }
}

function getToolStateFromConfirmation(
  state: AtlasToolCallMessageProps['state']
): ToolState {
  switch (state) {
    case 'confirmed':
      return 'success';
    case 'rejected':
      return 'canceled';
    default:
      return 'idle';
  }
}

export const AtlasToolCallMessage: React.FunctionComponent<
  AtlasToolCallMessageProps
> = ({
  state,
  isUserSignedIn,
  description,
  connectionInfo,
  onConfirm,
  onReject,
}) => {
  const isPending = state === 'pending';

  return (
    <ActionCardMessage
      state={getToolStateFromConfirmation(state)}
      title={getTitle(state, isUserSignedIn)}
      chips={
        connectionInfo
          ? [{ label: connectionInfo.name, glyph: <ServerIcon /> }]
          : []
      }
      showActions={isPending}
      buttons={[
        {
          label: isUserSignedIn ? 'Cancel' : 'Skip',
          variant: 'default',
          onClick: onReject,
        },
        {
          label: isUserSignedIn ? 'Run' : 'Connect to Atlas',
          variant: 'primary',
          onClick: onConfirm,
          isPrimary: true,
        },
      ]}
    >
      {description}
    </ActionCardMessage>
  );
};
