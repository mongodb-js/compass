import React, { useState } from 'react';
import {
  Icon,
  Body,
  Button,
  ButtonVariant,
  spacing,
  css,
  cx,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useMCPController } from '@mongodb-js/compass-generative-ai/provider';

const toolCallCardStyles = css({
  padding: spacing[200],
  borderRadius: spacing[200],
  backgroundColor: palette.gray.light3,
  border: `1px solid ${palette.gray.light2}`,
});

const toolCallCardDarkModeStyles = css({
  backgroundColor: palette.gray.dark3,
  borderColor: palette.gray.dark2,
});

const toolHeaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  marginBottom: spacing[100],
});

const toolIconContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: spacing[400],
  height: spacing[400],
  borderRadius: '4px',
  backgroundColor: palette.white,
});

const toolIconContainerDarkModeStyles = css({
  backgroundColor: palette.gray.dark2,
});

const toolNameStyles = css({
  fontFamily: 'Source Code Pro, monospace',
  fontWeight: 600,
  fontSize: '12px',
  lineHeight: '16px',
});

const toolDescriptionStyles = css({
  marginBottom: spacing[100],
  fontSize: '12px',
  lineHeight: '16px',
});

const inputLabelStyles = css({
  fontWeight: 600,
  fontSize: '12px',
});

const codeBlockStyles = css({
  maxHeight: '200px',
  overflowY: 'auto',
  fontSize: '11px',
  backgroundColor: palette.gray.light2,
  padding: spacing[200],
  borderRadius: '4px',
  fontFamily: 'Source Code Pro, monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
});

const codeBlockDarkModeStyles = css({
  backgroundColor: palette.gray.dark2,
});

const expandableHeaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  padding: spacing[200],
  marginTop: spacing[100],
  borderRadius: '4px',
  backgroundColor: palette.gray.light2,
  transition: 'background-color color 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: palette.gray.light1,
    color: palette.black,
  },
});

const expandableHeaderDarkModeStyles = css({
  backgroundColor: palette.gray.dark2,
  '&:hover': {
    backgroundColor: palette.gray.dark1,
  },
});

const expandableContentStyles = css({
  marginTop: spacing[100],
  padding: spacing[100],
  borderRadius: '4px',
  backgroundColor: palette.gray.light2,
});

const expandableContentDarkModeStyles = css({
  backgroundColor: palette.gray.dark2,
});

const buttonGroupStyles = css({
  display: 'flex',
  gap: spacing[200],
  marginTop: spacing[300],
  '> button': {
    flex: 1,
  },
});

const statusStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  marginTop: spacing[200],
});

const statusTextStyles = css({
  color: palette.gray.dark1,
  fontWeight: 500,
  fontSize: '12px',
});

const collectionListStyles = css({
  marginTop: spacing[200],
  marginBottom: spacing[200],
  paddingLeft: spacing[300],
});

const collectionItemStyles = css({
  fontSize: '13px',
  lineHeight: '20px',
  fontFamily: 'Source Code Pro, monospace',
  color: palette.gray.dark2,
});

const collectionItemDarkModeStyles = css({
  color: palette.gray.light2,
});

const collectionHeaderStyles = css({
  fontWeight: 600,
  fontSize: '13px',
  marginBottom: spacing[100],
});

export interface ToolCallPart {
  type: string;
  toolCallId?: string;
  state?:
    | 'approval-requested'
    | 'approval-responded'
    | 'input-available'
    | 'output-available'
    | 'output-error'
    | 'output-denied';
  input?: Record<string, unknown>;
  output?: {
    content?: Array<{
      type: string;
      text?: string;
    }>;
  };
  approval?: {
    id: string;
    approved?: boolean;
    reason?: string;
  };
}

interface ToolCallMessageProps {
  toolCall: ToolCallPart;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
}

// Extract tool name from type (e.g., "tool-list-databases" -> "list-databases")
function getToolDisplayName(type: string): string {
  return type.replace(/^tool-/, '');
}

// Parse collection names from the list-collections output
function parseCollectionNames(outputText: string): string[] {
  const collections: string[] = [];
  const lines = outputText.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Match lines that are just quoted strings
    const match = trimmedLine.match(/^"(.+)"$/);
    if (match) {
      collections.push(match[1]);
    }
  }

  return collections;
}

export const ToolCallMessage: React.FunctionComponent<ToolCallMessageProps> = ({
  toolCall,
  onApprove,
  onDeny,
}) => {
  const darkMode = useDarkMode();
  const mcpController = useMCPController();
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);

  const toolName = getToolDisplayName(toolCall.type);
  const description =
    mcpController.getToolDescription(toolCall.type.replace(/^tool-/, '')) || '';
  const inputJSON = JSON.stringify(toolCall.input || {}, null, 2);

  // Extract output text if available
  const outputText =
    toolCall.output?.content
      ?.filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join('\n') || 'No output available';
  const hasOutput = toolCall.state === 'output-available';

  const isAwaitingApproval = toolCall.state === 'approval-requested';
  const isApprovalResponded = toolCall.state === 'approval-responded';
  const isDenied = toolCall.state === 'output-denied';
  const wasApproved = toolCall.approval?.approved === true;

  // Special handling for list-collections
  const isListCollections = toolName === 'list-collections';
  const collections =
    isListCollections && hasOutput ? parseCollectionNames(outputText) : [];
  const databaseName = isListCollections
    ? (toolCall.input as { database?: string })?.database
    : undefined;

  return (
    <div
      className={cx(toolCallCardStyles, darkMode && toolCallCardDarkModeStyles)}
    >
      {isListCollections && collections.length > 0 ? (
        // Special rendering for list-collections
        <>
          <div className={toolHeaderStyles}>
            <div className={collectionHeaderStyles}>
              Collections in database &quot;{databaseName}&quot;
            </div>
          </div>
          <ul className={collectionListStyles}>
            {collections.map((collection, index) => (
              <li
                key={index}
                className={cx(
                  collectionItemStyles,
                  darkMode && collectionItemDarkModeStyles
                )}
              >
                {collection}
              </li>
            ))}
          </ul>
        </>
      ) : (
        // Default rendering for all other tools
        <div className={toolHeaderStyles}>
          <div
            className={cx(
              toolIconContainerStyles,
              darkMode && toolIconContainerDarkModeStyles
            )}
          >
            <Icon glyph="Wrench" size="xsmall" />
          </div>
          <div className={toolNameStyles}>
            <b>{toolName}</b>: {description}
          </div>
        </div>
      )}

      {/* Input Section */}
      <div>
        <div
          role="button"
          tabIndex={0}
          className={cx(
            expandableHeaderStyles,
            darkMode && expandableHeaderDarkModeStyles
          )}
          onClick={() => setIsInputExpanded(!isInputExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsInputExpanded(!isInputExpanded);
            }
          }}
        >
          <span className={inputLabelStyles}>Input</span>
          <Icon
            glyph={isInputExpanded ? 'ChevronDown' : 'ChevronRight'}
            size="xsmall"
          />
        </div>
        {isInputExpanded && (
          <div
            className={cx(
              expandableContentStyles,
              darkMode && expandableContentDarkModeStyles
            )}
          >
            <div
              className={cx(
                codeBlockStyles,
                darkMode && codeBlockDarkModeStyles
              )}
            >
              {inputJSON}
            </div>
          </div>
        )}
      </div>

      {/* Output Section - only show if there's output */}
      {hasOutput && (
        <div>
          <div
            role="button"
            tabIndex={0}
            className={cx(
              expandableHeaderStyles,
              darkMode && expandableHeaderDarkModeStyles
            )}
            onClick={() => setIsOutputExpanded(!isOutputExpanded)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOutputExpanded(!isOutputExpanded);
              }
            }}
          >
            <span className={inputLabelStyles}>Output</span>
            <Icon
              glyph={isOutputExpanded ? 'ChevronDown' : 'ChevronRight'}
              size="xsmall"
            />
          </div>
          {isOutputExpanded && (
            <div
              className={cx(
                expandableContentStyles,
                darkMode && expandableContentDarkModeStyles
              )}
            >
              <div
                className={cx(
                  codeBlockStyles,
                  darkMode && codeBlockDarkModeStyles
                )}
              >
                {outputText}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approval buttons - show when approval is requested */}
      {isAwaitingApproval && toolCall.approval && (
        <div className={buttonGroupStyles}>
          <Button
            variant={ButtonVariant.Default}
            onClick={() => onDeny?.(toolCall.approval!.id)}
            size="xsmall"
          >
            Deny
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            onClick={() => onApprove?.(toolCall.approval!.id)}
            size="xsmall"
          >
            Allow
          </Button>
        </div>
      )}

      {/* Status indicator for responded/denied states */}
      {(isApprovalResponded || isDenied) && toolCall.approval && (
        <div className={statusStyles}>
          <Icon
            glyph={wasApproved ? 'CheckmarkWithCircle' : 'XWithCircle'}
            color={palette.gray.dark1}
            size="xsmall"
          />
          <Body className={statusTextStyles} weight="medium">
            {wasApproved ? 'Tool call approved' : 'Tool call denied'}
            {toolCall.approval.reason && ` - ${toolCall.approval.reason}`}
          </Body>
        </div>
      )}
    </div>
  );
};
