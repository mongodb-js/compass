import React from 'react';
import {
  Body,
  Icon,
  spacing,
  css,
  cx,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { ToolUIPart } from 'ai';
import type { AtlasConnectionDebugResult } from '@mongodb-js/atlas-service/provider';

const containerStyles = css({
  padding: spacing[300],
  borderRadius: spacing[200],
  backgroundColor: palette.gray.light3,
  border: `1px solid ${palette.gray.light2}`,
});

const containerDarkStyles = css({
  backgroundColor: palette.gray.dark3,
  borderColor: palette.gray.dark2,
});

const titleStyles = css({
  marginBottom: spacing[200],
  fontWeight: 600,
});

const checkRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[150],
  paddingTop: spacing[100],
  paddingBottom: spacing[100],
});

const checkLabelStyles = css({
  flex: 1,
});

const valueStyles = css({
  color: palette.gray.dark1,
});

interface AtlasConnectionErrorDebuggerResultProps {
  toolCall: ToolUIPart;
}

function isDebugResult(output: unknown): output is AtlasConnectionDebugResult {
  return (
    !!output &&
    typeof output === 'object' &&
    'clusterState' in output &&
    'ipAccessListed' in output
  );
}

export const AtlasConnectionErrorDebuggerResult: React.FunctionComponent<
  AtlasConnectionErrorDebuggerResultProps
> = ({ toolCall }) => {
  const darkMode = useDarkMode();
  const output = toolCall.output;

  if (!isDebugResult(output)) {
    return null;
  }

  return (
    <div
      className={cx(containerStyles, darkMode && containerDarkStyles)}
      data-testid="atlas-connection-error-debugger-result"
    >
      <Body className={titleStyles}>Atlas connection diagnostics</Body>
      <div className={checkRowStyles}>
        <Icon glyph="CheckmarkWithCircle" color={palette.gray.dark1} />
        <Body className={checkLabelStyles}>Cluster state</Body>
        <Body className={valueStyles}>{output.clusterState}</Body>
      </div>
      <div className={checkRowStyles}>
        <Icon
          glyph={output.ipAccessListed ? 'CheckmarkWithCircle' : 'XWithCircle'}
          color={palette.gray.dark1}
        />
        <Body className={checkLabelStyles}>IP access</Body>
        <Body className={valueStyles}>
          {output.ipAccessListed ? 'Allowed' : 'Not allowed'}
        </Body>
      </div>
      {output.message && <Body className={valueStyles}>{output.message}</Body>}
    </div>
  );
};
