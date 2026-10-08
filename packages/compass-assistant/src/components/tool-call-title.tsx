import { type ToolUIPart } from 'ai';
import React from 'react';
import type { TranslateFn } from '@mongodb-js/compass-components';

export function withToolName(
  template: string,
  toolNameElement: React.ReactNode
): React.ReactNode {
  const [before, after] = template.split('{tool}');
  return (
    <>
      {before}
      {toolNameElement}
      {after}
    </>
  );
}

export function getToolCallTitle(
  toolCall: ToolUIPart,
  toolNameElement: React.ReactNode,
  approvalMessage?: string | React.ReactNode,
  t: TranslateFn = (_key, english) => english
): React.ReactNode {
  const wasApproved = toolCall.approval?.approved === true;
  const isDenied = toolCall.state === 'output-denied';
  const didRun =
    toolCall.state === 'output-available' || toolCall.state === 'output-error';

  if (didRun) {
    return withToolName(
      t('assistant.toolCall.ran', 'Ran {tool}'),
      toolNameElement
    );
  }
  if (wasApproved) {
    return withToolName(
      t('assistant.toolCall.running', 'Running {tool}'),
      toolNameElement
    );
  }
  if (isDenied) {
    return withToolName(
      t('assistant.toolCall.cancelled', 'Cancelled {tool}'),
      toolNameElement
    );
  }

  return approvalMessage ? (
    <>{approvalMessage}</>
  ) : (
    withToolName(t('assistant.toolCall.run', 'Run {tool}?'), toolNameElement)
  );
}
