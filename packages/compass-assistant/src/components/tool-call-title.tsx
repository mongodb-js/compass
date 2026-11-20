import { type ToolUIPart } from 'ai';
import React from 'react';

export function getToolCallTitle(
  toolCall: ToolUIPart,
  toolNameElement: React.ReactNode,
  approvalMessage?: string | React.ReactNode
): React.ReactNode {
  const wasApproved = toolCall.approval?.approved === true;
  // `output-denied` only arrives once the follow-up request round-trips through
  // the assistant backend, so we render "Cancelled" optimistically while the
  // denial is still being sent (state: approval-responded).
  const isDenied =
    toolCall.state === 'output-denied' ||
    (toolCall.state === 'approval-responded' &&
      toolCall.approval?.approved === false);
  const didRun =
    toolCall.state === 'output-available' || toolCall.state === 'output-error';

  if (didRun) return <>Ran {toolNameElement}</>;
  if (wasApproved) return <>Running {toolNameElement}</>;
  if (isDenied) return <>Cancelled {toolNameElement}</>;

  return approvalMessage ? <>{approvalMessage}</> : <>Run {toolNameElement}?</>;
}
