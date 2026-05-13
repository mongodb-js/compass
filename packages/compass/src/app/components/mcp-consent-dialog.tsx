import React, { useCallback, useEffect, useState } from 'react';
import { ipcRenderer } from 'hadron-ipc';
import {
  Banner,
  BannerVariant,
  Body,
  Checkbox,
  ConfirmationModal,
  Label,
  Radio,
  RadioGroup,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';

interface ConsentRequest {
  requestId: string;
  connectionId: string;
  connectionName: string;
}

type McpPreset = 'metadata-only' | 'read-only' | 'full-access';

interface ConsentResponse {
  access: { mode: 'allowed'; preset: McpPreset } | { mode: 'denied' };
  remember: boolean;
}

const presetGroupStyles = css({
  marginTop: spacing[3],
});

const presetDescriptionStyles = css({
  marginLeft: spacing[4],
  marginBottom: spacing[2],
  fontSize: '12px',
  color: palette.gray.base,
});

const warningStyles = css({
  marginTop: spacing[2],
});

const checkboxContainerStyles = css({
  marginTop: spacing[3],
});

const PRESET_OPTIONS: {
  value: McpPreset;
  label: string;
  description: string;
}[] = [
  {
    value: 'metadata-only',
    label: 'Metadata only',
    description:
      'Schema, indexes, storage size, query plans. No documents are read.',
  },
  {
    value: 'read-only',
    label: 'Read-only data',
    description:
      'Everything above, plus find / count / aggregate against your data.',
  },
  {
    value: 'full-access',
    label: 'Full access',
    description:
      'Everything above, plus insert / update / delete and create / drop collections, indexes, and databases.',
  },
];

/**
 * Modal shown when an external MCP client first requests access to a
 * Compass connection. Lets the user pick a preset (Metadata only / Read-only
 * data / Full access) and optionally remember the choice. Listens for
 * 'mcp:consent-request' IPC events from the main process and sends a
 * 'mcp:consent-response:<requestId>' back.
 */
export function McpConsentDialog(): React.ReactElement | null {
  const [pending, setPending] = useState<ConsentRequest | null>(null);
  const [preset, setPreset] = useState<McpPreset>('read-only');
  const [confirmFullAccess, setConfirmFullAccess] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const handler = (_event: unknown, request: ConsentRequest) => {
      setPending(request);
      // Reset to safe defaults on each new request.
      setPreset('read-only');
      setConfirmFullAccess(false);
      setRemember(false);
    };
    ipcRenderer?.on('mcp:consent-request', handler as never);
    return () => {
      ipcRenderer?.removeListener('mcp:consent-request', handler as never);
    };
  }, []);

  const respond = useCallback(
    (response: ConsentResponse) => {
      if (!pending) return;
      ipcRenderer?.send(`mcp:consent-response:${pending.requestId}`, response);
      setPending(null);
    },
    [pending]
  );

  const onAllow = useCallback(() => {
    respond({ access: { mode: 'allowed', preset }, remember });
  }, [preset, remember, respond]);

  const onDeny = useCallback(() => {
    respond({ access: { mode: 'denied' }, remember });
  }, [remember, respond]);

  if (!pending) return null;

  const allowDisabled = preset === 'full-access' && !confirmFullAccess;

  return (
    <ConfirmationModal
      open
      title="AI Tool Connection Request"
      buttonText="Allow"
      submitDisabled={allowDisabled}
      onConfirm={onAllow}
      onCancel={onDeny}
      data-testid="mcp-consent-dialog"
    >
      <Body>
        An external AI tool wants to use your{' '}
        <strong>{pending.connectionName}</strong> MongoDB connection.
      </Body>

      <div className={presetGroupStyles}>
        <Label htmlFor="mcp-consent-preset">What can it do?</Label>
        <RadioGroup
          id="mcp-consent-preset"
          name="mcp-consent-preset"
          value={preset}
          onChange={(e) => {
            setPreset(e.target.value as McpPreset);
            setConfirmFullAccess(false);
          }}
        >
          {PRESET_OPTIONS.map((opt) => (
            <React.Fragment key={opt.value}>
              <Radio value={opt.value}>{opt.label}</Radio>
              <div className={presetDescriptionStyles}>{opt.description}</div>
            </React.Fragment>
          ))}
        </RadioGroup>
      </div>

      {preset === 'full-access' && (
        <Banner variant={BannerVariant.Warning} className={warningStyles}>
          <Body>
            Full access lets the AI insert, update, and delete documents and
            change schema on this connection.
          </Body>
          <div className={checkboxContainerStyles}>
            <Checkbox
              id="mcp-consent-full-access-confirm"
              checked={confirmFullAccess}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmFullAccess(e.target.checked)
              }
              label={
                <Label htmlFor="mcp-consent-full-access-confirm">
                  I understand. Allow full access.
                </Label>
              }
            />
          </div>
        </Banner>
      )}

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
