import { type ToolUIPart } from 'ai';
import React from 'react';

export function getToolCallTitle(
  toolCall: ToolUIPart,
  toolNameElement: React.ReactNode,
  approvalMessage?: string | React.ReactNode
): React.ReactNode {
  const wasApproved = toolCall.approval?.approved === true;
  const isDenied = toolCall.state === 'output-denied';
  const didRun =
    toolCall.state === 'output-available' || toolCall.state === 'output-error';

  if (didRun) return <>Ran {toolNameElement}</>;
  if (wasApproved) return <>Running {toolNameElement}</>;
  if (isDenied) return <>Cancelled {toolNameElement}</>;

  return approvalMessage ? <>{approvalMessage}</> : <>Run {toolNameElement}?</>;
}
