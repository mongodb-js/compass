import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  css,
  spacing,
  palette,
  Banner,
  BannerVariant,
  Button,
  ButtonVariant,
  Icon,
  TextInput,
  Label,
  Body,
  Subtitle,
  Badge,
  BadgeVariant,
  KeylineCard,
  getScrollbarStyles,
} from '@mongodb-js/compass-components';
import type {
  AgentShellState,
  ChatMessage,
  PendingCommand,
} from '../stores/store';
import { getRiskLabel } from '../services/ai-service';

// ─── Styles ──────────────────────────────────────────────────

const containerStyles = css(
  {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: palette.black,
    color: palette.white,
  },
  getScrollbarStyles(true)
);

const headerStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing[300]}px ${spacing[400]}px`,
  borderBottom: `1px solid ${palette.gray.dark2}`,
  backgroundColor: palette.gray.dark4,
});

const headerLeftStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: `${spacing[200]}px`,
});

const configPanelStyles = css({
  padding: spacing[400],
  borderBottom: `1px solid ${palette.gray.dark2}`,
  backgroundColor: palette.gray.dark3,
  display: 'flex',
  flexDirection: 'column',
  gap: `${spacing[200]}px`,
});

const configRowStyles = css({
  display: 'flex',
  gap: `${spacing[300]}px`,
  alignItems: 'flex-end',
});

const configFieldStyles = css({
  flex: 1,
});

const messagesContainerStyles = css(
  {
    flex: 1,
    overflowY: 'auto',
    padding: `${spacing[400]}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing[300]}px`,
  },
  getScrollbarStyles(true)
);

const messageStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: `${spacing[100]}px`,
});

const messageHeaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: `${spacing[200]}px`,
});

const messageContentStyles = css({
  paddingLeft: `${spacing[100]}px`,
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
});

const commandPreviewStyles = css({
  margin: `${spacing[200]}px 0`,
  padding: spacing[300],
  backgroundColor: palette.gray.dark3,
  borderRadius: spacing[200],
  border: `1px solid ${palette.gray.dark2}`,
  fontFamily: 'monospace',
  fontSize: 13,
  whiteSpace: 'pre-wrap',
  overflowX: 'auto',
  color: palette.green.light2,
});

const commandActionsStyles = css({
  display: 'flex',
  gap: `${spacing[200]}px`,
  marginTop: `${spacing[200]}px`,
});

const executionResultStyles = css({
  margin: `${spacing[200]}px 0`,
  padding: spacing[300],
  backgroundColor: palette.gray.dark3,
  borderRadius: spacing[200],
  border: `1px solid ${palette.gray.dark2}`,
  fontFamily: 'monospace',
  fontSize: 12,
  whiteSpace: 'pre-wrap',
  overflowX: 'auto',
  maxHeight: 300,
  overflowY: 'auto',
  color: palette.gray.light2,
});

const inputContainerStyles = css({
  display: 'flex',
  gap: `${spacing[200]}px`,
  padding: `${spacing[300]}px ${spacing[400]}px`,
  borderTop: `1px solid ${palette.gray.dark2}`,
  backgroundColor: palette.gray.dark4,
});

const inputStyles = css({
  flex: 1,
});

const timestampStyles = css({
  fontSize: 11,
  color: palette.gray.base,
});

const systemMessageStyles = css({
  padding: spacing[300],
  backgroundColor: palette.gray.dark3,
  borderRadius: spacing[200],
  borderLeft: `3px solid ${palette.blue.base}`,
  color: palette.gray.light2,
  fontSize: 13,
});

const loadingStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: `${spacing[200]}px`,
  padding: spacing[300],
  color: palette.gray.light1,
  fontStyle: 'italic',
});

const riskBannerStyles = css({
  marginBottom: `${spacing[200]}px`,
});

// ─── Component Props ─────────────────────────────────────────

type AgentShellProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  agentConfig: AgentShellState['agentConfig'];
  showConfig: boolean;
  namespace?: string;
  onSendMessage: (message: string, namespace?: string) => void;
  onApproveCommand: (
    messageId: string,
    command: string,
    namespace?: string
  ) => void;
  onUpdateConfig: (config: Partial<AgentShellState['agentConfig']>) => void;
  onToggleConfig: () => void;
};

// ─── Sub-components ──────────────────────────────────────────

function CommandPreview({
  messageId,
  pendingCommand,
  executionResult,
  isError,
  onApprove,
}: {
  messageId: string;
  pendingCommand: PendingCommand;
  executionResult?: string;
  isError?: boolean;
  onApprove: (messageId: string, command: string) => void;
}) {
  const riskInfo = getRiskLabel(pendingCommand.risk);
  const isExecuted = executionResult !== undefined;

  return (
    <div>
      <div className={riskBannerStyles}>
        <Badge
          variant={
            riskInfo.variant === 'danger'
              ? BadgeVariant.Red
              : riskInfo.variant === 'warning'
              ? BadgeVariant.Yellow
              : BadgeVariant.Blue
          }
        >
          {riskInfo.label}
        </Badge>
      </div>
      <div className={commandPreviewStyles}>{pendingCommand.command}</div>
      {!isExecuted && (
        <div className={commandActionsStyles}>
          <Button
            variant={ButtonVariant.Primary}
            size="small"
            leftGlyph={<Icon glyph="Play" />}
            onClick={() => onApprove(messageId, pendingCommand.command)}
            data-testid="approve-command-button"
          >
            Approve &amp; Execute
          </Button>
        </div>
      )}
      {isExecuted && (
        <div>
          <Body>
            <strong>{isError ? '❌ Error:' : '✅ Result:'}</strong>
          </Body>
          <div
            className={executionResultStyles}
            style={isError ? { borderColor: palette.red.base } : undefined}
          >
            {executionResult}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatMessageItem({
  message,
  onApprove,
}: {
  message: ChatMessage;
  onApprove: (messageId: string, command: string) => void;
}) {
  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  if (message.role === 'system') {
    return <div className={systemMessageStyles}>{message.content}</div>;
  }

  const roleColor =
    message.role === 'user' ? palette.green.base : palette.blue.light1;
  const roleLabel = message.role === 'user' ? 'You' : 'Agent';

  return (
    <div className={messageStyles}>
      <div className={messageHeaderStyles}>
        <Subtitle
          as="span"
          style={{ color: roleColor, fontSize: 13, fontWeight: 700 }}
        >
          {roleLabel}
        </Subtitle>
        <span className={timestampStyles}>{formatTime(message.timestamp)}</span>
      </div>
      <div className={messageContentStyles}>{message.content}</div>
      {message.pendingCommand && (
        <CommandPreview
          messageId={message.id}
          pendingCommand={message.pendingCommand}
          executionResult={message.executionResult}
          isError={message.isError}
          onApprove={onApprove}
        />
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

const AgentShell: React.FC<AgentShellProps> = ({
  messages,
  isLoading,
  agentConfig,
  showConfig,
  namespace,
  onSendMessage,
  onApproveCommand,
  onUpdateConfig,
  onToggleConfig,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed, namespace);
    setInput('');
  }, [input, isLoading, onSendMessage, namespace]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const isConfigured = agentConfig.apiKey.length > 0;

  return (
    <div className={containerStyles} data-testid="agent-shell-section">
      {/* Header */}
      <div className={headerStyles}>
        <div className={headerLeftStyles}>
          <Icon glyph="Sparkle" />
          <Subtitle>AI Agent Shell</Subtitle>
          {isConfigured && (
            <Badge variant={BadgeVariant.Green}>Connected</Badge>
          )}
        </div>
        <Button
          variant={ButtonVariant.Default}
          size="small"
          leftGlyph={<Icon glyph="Settings" />}
          onClick={onToggleConfig}
          data-testid="agent-toggle-config"
        >
          {showConfig ? 'Hide Settings' : 'Settings'}
        </Button>
      </div>

      {/* Config Panel */}
      {showConfig && (
        <div className={configPanelStyles}>
          <Banner variant={BannerVariant.Info}>
            Enter your API key and configure the endpoint below. Works with any
            OpenAI-compatible API — Groq, OpenAI, Gemini, Ollama, etc.
          </Banner>
          <div className={configRowStyles}>
            <div className={configFieldStyles}>
              <Label htmlFor="agent-api-key">API Key</Label>
              <TextInput
                id="agent-api-key"
                type="password"
                placeholder="sk-... or gsk_..."
                value={agentConfig.apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateConfig({ apiKey: e.target.value })
                }
                data-testid="agent-api-key-input"
              />
            </div>
            <div className={configFieldStyles}>
              <Label htmlFor="agent-base-url">Base URL</Label>
              <TextInput
                id="agent-base-url"
                placeholder="https://api.groq.com/openai/v1"
                value={agentConfig.baseUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateConfig({ baseUrl: e.target.value })
                }
                data-testid="agent-base-url-input"
              />
            </div>
            <div className={configFieldStyles}>
              <Label htmlFor="agent-model">Model</Label>
              <TextInput
                id="agent-model"
                placeholder="llama-3.3-70b-versatile"
                value={agentConfig.model}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateConfig({ model: e.target.value })
                }
                data-testid="agent-model-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={messagesContainerStyles}>
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            onApprove={(messageId, command) =>
              onApproveCommand(messageId, command, namespace)
            }
          />
        ))}
        {isLoading && (
          <div className={loadingStyles}>
            <Icon glyph="Refresh" />
            <span>Agent is thinking…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={inputContainerStyles}>
        <div className={inputStyles}>
          <TextInput
            placeholder={
              isConfigured
                ? 'Ask about your database in plain English…'
                : 'Configure your API key above to get started…'
            }
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            disabled={!isConfigured || isLoading}
            data-testid="agent-chat-input"
          />
        </div>
        <Button
          variant={ButtonVariant.Primary}
          leftGlyph={<Icon glyph="ChevronRight" />}
          onClick={handleSend}
          disabled={!isConfigured || isLoading || !input.trim()}
          data-testid="agent-send-button"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default AgentShell;
