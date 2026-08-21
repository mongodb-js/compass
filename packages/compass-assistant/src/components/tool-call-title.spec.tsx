import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { ToolUIPart } from 'ai';
import { getToolCallTitle } from './tool-call-title';

describe('getToolCallTitle', function () {
  const baseToolCall: ToolUIPart = {
    toolCallId: 'tool-call-1',
    type: 'tool-list-databases',
    approval: undefined,
    input: { foo: 'bar' },
    output: undefined,
    state: 'input-available',
    errorText: undefined,
  };

  const toolName = <span>list-databases</span>;

  it('renders "Ran" for output-available state', function () {
    const toolCall: ToolUIPart = {
      ...baseToolCall,
      state: 'output-available',
      output: { databases: [] },
    };

    render(<>{getToolCallTitle(toolCall, toolName)}</>);

    expect(screen.getByText(/Ran/)).to.exist;
    expect(screen.getByText('list-databases')).to.exist;
  });

  it('renders "Ran" for output-error state', function () {
    const toolCall: ToolUIPart = {
      ...baseToolCall,
      state: 'output-error',
      errorText: 'boom',
    };

    render(<>{getToolCallTitle(toolCall, toolName)}</>);

    expect(screen.getByText(/Ran/)).to.exist;
    expect(screen.getByText('list-databases')).to.exist;
  });

  it('renders "Running" when the tool was approved', function () {
    const toolCall: ToolUIPart = {
      ...baseToolCall,
      state: 'approval-responded',
      approval: { id: 'approval-1', approved: true },
    };

    render(<>{getToolCallTitle(toolCall, toolName)}</>);

    expect(screen.getByText(/Running/)).to.exist;
    expect(screen.getByText('list-databases')).to.exist;
  });

  it('renders "Cancelled" for output-denied state', function () {
    const toolCall: ToolUIPart = {
      ...baseToolCall,
      state: 'output-denied',
      approval: { id: 'approval-1', approved: false },
    };

    render(<>{getToolCallTitle(toolCall, toolName)}</>);

    expect(screen.getByText(/Cancelled/)).to.exist;
    expect(screen.getByText('list-databases')).to.exist;
  });

  it('renders the default "Run ...?" prompt when awaiting approval', function () {
    const toolCall: ToolUIPart = {
      ...baseToolCall,
      state: 'approval-requested',
      approval: { id: 'approval-1', approved: undefined },
    };

    render(<>{getToolCallTitle(toolCall, toolName)}</>);

    expect(screen.getByText(/Run/)).to.exist;
    expect(screen.getByText(/\?/)).to.exist;
    expect(screen.getByText('list-databases')).to.exist;
  });

  it('renders a custom approval message when provided and awaiting approval', function () {
    const toolCall: ToolUIPart = {
      ...baseToolCall,
      state: 'approval-requested',
      approval: { id: 'approval-1', approved: undefined },
    };

    render(
      <>{getToolCallTitle(toolCall, toolName, 'Custom approval message')}</>
    );

    expect(screen.getByText('Custom approval message')).to.exist;
    expect(screen.queryByText('list-databases')).to.not.exist;
  });

  it('renders a custom approval message node when provided and awaiting approval', function () {
    const toolCall: ToolUIPart = {
      ...baseToolCall,
      state: 'approval-requested',
      approval: { id: 'approval-1', approved: undefined },
    };

    render(
      <>
        {getToolCallTitle(
          toolCall,
          toolName,
          <span>Node approval message</span>
        )}
      </>
    );

    expect(screen.getByText('Node approval message')).to.exist;
  });

  it('prioritizes "Ran" over an approved state', function () {
    const toolCall: ToolUIPart = {
      ...baseToolCall,
      state: 'output-available',
      output: { databases: [] },
      approval: { id: 'approval-1', approved: true },
    };

    render(<>{getToolCallTitle(toolCall, toolName)}</>);

    expect(screen.getByText(/Ran/)).to.exist;
    expect(screen.queryByText(/Running/)).to.not.exist;
  });
});
