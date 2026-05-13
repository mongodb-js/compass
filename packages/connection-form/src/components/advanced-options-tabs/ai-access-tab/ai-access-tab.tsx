import React, { useCallback, useState } from 'react';
import {
  Banner,
  BannerVariant,
  Body,
  Checkbox,
  FormFieldContainer,
  Label,
  Radio,
  RadioGroup,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import type { McpAccess, McpPreset } from '@mongodb-js/connection-info';
import { presetTools, presetLabel } from '@mongodb-js/compass-mcp-server';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

const toolsListStyles = css({
  marginTop: spacing[200],
  padding: spacing[300],
  background: palette.gray.light3,
  borderRadius: spacing[100],
  fontSize: '12px',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
});

type AccessMode = 'denied' | 'ask' | 'allowed';

const MODE_OPTIONS: {
  value: AccessMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'denied',
    label: 'Deny',
    description: 'AI tools cannot use this connection.',
  },
  {
    value: 'ask',
    label: 'Ask each session',
    description:
      'Prompt me the first time an AI tool wants to use this connection.',
  },
  {
    value: 'allowed',
    label: 'Allow',
    description: 'Let AI tools use this connection with the preset below.',
  },
];

const PRESET_OPTIONS: {
  value: McpPreset;
  description: string;
}[] = [
  {
    value: 'metadata-only',
    description:
      'Schema, indexes, storage size, query plans. No documents are read. Recommended for production.',
  },
  {
    value: 'read-only',
    description:
      'Everything above plus find / count / aggregate against your data.',
  },
  {
    value: 'full-access',
    description:
      'Read + write. AI can insert / update / delete documents and create / drop collections, indexes, and databases. Use for localhost and dev environments only.',
  },
];

export interface AiAccessTabProps {
  mcpAccess: McpAccess;
  updateConnectionFormField: UpdateConnectionFormField;
}

/**
 * Per-connection AI access editor. Lets the user pick whether external MCP
 * clients are allowed to use this connection and, if so, at what privilege
 * level. The tool-list preview below the preset radio is derived from the
 * preset's allowlist so users see exactly what they are authorizing.
 *
 * The tab is only mounted in hosts that opt in via the connection-form
 * `showAiAccess` setting (desktop Compass).
 */
export function AiAccessTab({
  mcpAccess,
  updateConnectionFormField,
}: AiAccessTabProps): React.ReactElement {
  const mode = mcpAccess.mode;
  const preset = mcpAccess.mode === 'allowed' ? mcpAccess.preset : 'read-only';

  // When the user picks 'full-access' from the preset radio we require a
  // local confirmation checkbox before propagating the change up. Local
  // ephemeral state — nothing is persisted until the parent form save runs.
  const [pendingFullAccessConfirm, setPendingFullAccessConfirm] =
    useState(false);

  const dispatchAccess = useCallback(
    (next: McpAccess) => {
      updateConnectionFormField({ type: 'update-mcp-access', mcpAccess: next });
    },
    [updateConnectionFormField]
  );

  const onModeChange = useCallback(
    (newMode: AccessMode) => {
      if (newMode === 'denied') {
        dispatchAccess({ mode: 'denied' });
      } else if (newMode === 'ask') {
        dispatchAccess({ mode: 'ask' });
      } else {
        const carry: McpPreset =
          mcpAccess.mode === 'allowed' ? mcpAccess.preset : 'metadata-only';
        dispatchAccess({ mode: 'allowed', preset: carry });
      }
      setPendingFullAccessConfirm(false);
    },
    [dispatchAccess, mcpAccess]
  );

  const onPresetChange = useCallback(
    (newPreset: McpPreset) => {
      if (newPreset === 'full-access') {
        setPendingFullAccessConfirm(true);
        return;
      }
      setPendingFullAccessConfirm(false);
      dispatchAccess({ mode: 'allowed', preset: newPreset });
    },
    [dispatchAccess]
  );

  const onConfirmFullAccess = useCallback(
    (checked: boolean) => {
      if (checked) {
        dispatchAccess({ mode: 'allowed', preset: 'full-access' });
      }
    },
    [dispatchAccess]
  );

  const effectivePreset: McpPreset = pendingFullAccessConfirm
    ? 'full-access'
    : preset;
  const toolNames = presetTools(effectivePreset);

  return (
    <>
      <FormFieldContainer>
        <Body>
          Controls whether external MCP clients (Claude Desktop, Cursor, VS
          Code, Windsurf, …) can use this connection — and what they can do.
        </Body>
      </FormFieldContainer>

      <FormFieldContainer>
        <Label htmlFor="ai-access-mode">Access mode</Label>
        <RadioGroup
          id="ai-access-mode"
          name="ai-access-mode"
          value={mode}
          onChange={(e) => onModeChange(e.target.value as AccessMode)}
        >
          {MODE_OPTIONS.map((opt) => (
            <Radio
              key={opt.value}
              value={opt.value}
              size="small"
              description={opt.description}
            >
              {opt.label}
            </Radio>
          ))}
        </RadioGroup>
      </FormFieldContainer>

      {mode === 'allowed' && (
        <>
          <FormFieldContainer>
            <Label htmlFor="ai-access-preset">Tool preset</Label>
            <RadioGroup
              id="ai-access-preset"
              name="ai-access-preset"
              value={effectivePreset}
              onChange={(e) => onPresetChange(e.target.value as McpPreset)}
            >
              {PRESET_OPTIONS.map((opt) => (
                <Radio
                  key={opt.value}
                  value={opt.value}
                  size="small"
                  description={opt.description}
                >
                  {presetLabel(opt.value)}
                  {opt.value === 'full-access' ? ' ⚠' : ''}
                </Radio>
              ))}
            </RadioGroup>
          </FormFieldContainer>

          {pendingFullAccessConfirm && preset !== 'full-access' && (
            <FormFieldContainer>
              <Banner variant={BannerVariant.Warning}>
                <Body>
                  Full access lets the AI insert, update, and delete documents
                  and change schema on this connection.
                </Body>
                <Checkbox
                  id="ai-access-confirm-full"
                  checked={false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onConfirmFullAccess(e.target.checked)
                  }
                  label={
                    <Label htmlFor="ai-access-confirm-full">
                      I understand. Enable full access.
                    </Label>
                  }
                />
              </Banner>
            </FormFieldContainer>
          )}

          <FormFieldContainer>
            <Label htmlFor="ai-access-tools-list">
              Tools the AI will be able to use ({toolNames.length})
            </Label>
            <div id="ai-access-tools-list" className={toolsListStyles}>
              {toolNames.map((t) => `• ${t}`).join('\n')}
            </div>
          </FormFieldContainer>
        </>
      )}
    </>
  );
}

export default AiAccessTab;
