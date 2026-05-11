import React, { useCallback, useEffect, useState } from 'react';
import { ipcRenderer } from 'hadron-ipc';
import {
  Body,
  Checkbox,
  ConfirmationModal,
  Label,
  spacing,
  css,
} from '@mongodb-js/compass-components';

interface ConsentRequest {
  requestId: string;
  connectionId: string;
  connectionName: string;
}

const checkboxContainerStyles = css({
  marginTop: spacing[3],
});

/**
 * Renders a modal dialog when an external MCP client requests access to a
 * Compass connection. Listens for 'mcp:consent-request' IPC events from the
 * main process and sends 'mcp:consent-response:<requestId>' back.
 */
export function McpConsentDialog(): React.ReactElement | null {
  const [pending, setPending] = useState<ConsentRequest | null>(null);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const handler = (_event: unknown, request: ConsentRequest) => {
      setPending(request);
      setRemember(false);
    };
    ipcRenderer?.on('mcp:consent-request', handler as never);
    return () => {
      ipcRenderer?.removeListener('mcp:consent-request', handler as never);
    };
  }, []);

  const respond = useCallback(
    (decision: 'allowed' | 'denied') => {
      if (!pending) return;
      ipcRenderer?.send(`mcp:consent-response:${pending.requestId}`, {
        decision,
        remember,
      });
      setPending(null);
    },
    [pending, remember]
  );

  if (!pending) return null;

  return (
    <ConfirmationModal
      open
      title="AI Tool Connection Request"
      buttonText="Allow"
      onConfirm={() => respond('allowed')}
      onCancel={() => respond('denied')}
      data-testid="mcp-consent-dialog"
    >
      <Body>
        An external AI tool wants to connect to your{' '}
        <strong>{pending.connectionName}</strong> MongoDB connection.
      </Body>
      <div className={checkboxContainerStyles}>
        <Checkbox
          id="mcp-consent-remember"
          checked={remember}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setRemember(e.target.checked)
          }
          label={
            <Label htmlFor="mcp-consent-remember">
              Remember my choice for this connection
            </Label>
          }
        />
      </div>
    </ConfirmationModal>
  );
}
