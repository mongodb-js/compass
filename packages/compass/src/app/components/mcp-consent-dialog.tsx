import React, { useCallback, useEffect, useState } from 'react';
import { ipcRenderer } from 'hadron-ipc';
import {
  Banner,
  BannerVariant,
  Body,
  Checkbox,
  ConfirmationModal,
  FormFieldContainer,
  Label,
  Radio,
  RadioGroup,
} from '@mongodb-js/compass-components';
import { MCP_IPC } from '@mongodb-js/compass-mcp-server';

interface ConsentRequest {
  requestId: string;
  connectionId: string;
  connectionName: string;
  /** MCP `clientInfo.name` reported during initialize. */
  clientName: string;
}

type McpPreset = 'metadata-only' | 'read-only' | 'full-access';

interface ConsentResponse {
  access: { mode: 'allowed'; preset: McpPreset } | { mode: 'denied' };
  remember: boolean;
}

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
    label: 'Full access ⚠',
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
 *
 * Layout / radio wiring mirrors `ai-access-tab.tsx` — FormFieldContainer for
 * spacing, explicit `checked` + `onClick` per Radio (RadioGroup's `value`
 * alone does not auto-check children in our LeafyGreen version).
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
    ipcRenderer?.on(MCP_IPC.ConsentRequest, handler);
    return () => {
      ipcRenderer?.removeListener(MCP_IPC.ConsentRequest, handler);
    };
  }, []);

  const respond = useCallback(
    (response: ConsentResponse) => {
      if (!pending) return;
      ipcRenderer?.send(MCP_IPC.consentResponse(pending.requestId), response);
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

  const onPresetClick = useCallback((next: McpPreset) => {
    setPreset(next);
    setConfirmFullAccess(false);
  }, []);

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
      <FormFieldContainer>
        <Body>
          <strong>{pending.clientName}</strong> wants to use your{' '}
          <strong>{pending.connectionName}</strong> MongoDB connection.
        </Body>
      </FormFieldContainer>

      <FormFieldContainer>
        <Label htmlFor="mcp-consent-preset">What can it do?</Label>
        <RadioGroup id="mcp-consent-preset" value={preset}>
          {PRESET_OPTIONS.map((opt) => (
            <Radio
              key={opt.value}
              value={opt.value}
              checked={preset === opt.value}
              onClick={() => onPresetClick(opt.value)}
              size="small"
              description={opt.description}
            >
              {opt.label}
            </Radio>
          ))}
        </RadioGroup>
      </FormFieldContainer>

      {preset === 'full-access' && (
        <FormFieldContainer>
          <Banner variant={BannerVariant.Warning}>
            <Body>
              Full access lets the AI insert, update, and delete documents and
              change schema on this connection.
            </Body>
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
          </Banner>
        </FormFieldContainer>
      )}

      <FormFieldContainer>
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
      </FormFieldContainer>
    </ConfirmationModal>
  );
}
