import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { ToolCallMessage } from './tool-call-message';
import { expect } from 'chai';
import sinon from 'sinon';
import type { ToolUIPart } from 'ai';
import type { BasicConnectionInfo } from '../compass-assistant-provider';

function containsText(match: string) {
  return (_: unknown, element: Element | null): boolean => {
    // this only works for <>text <tag>more text</tag></> but that's sufficient for now
    const firstChild = element?.firstChild;
    if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
      // only check elements that start with text so we don't match on nested elements
      return element?.textContent === match;
    }

    return false;
  };
}

describe('ToolCallMessage', function () {
  const defaultConnection: BasicConnectionInfo = {
    id: 'test-connection-id',
    name: 'Test Connection',
  };

  const baseToolCall: ToolUIPart = {
    toolCallId: 'tool-call-1',
    type: 'tool-list-databases',
    approval: undefined,
    input: { foo: 'bar' },
    output: undefined,
    state: 'input-available',
    errorText: undefined,
  };

  describe('rendering tool name', function () {
    it('displays tool name without "tool-" prefix', function () {
      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={baseToolCall}
        />
      );

      expect(screen.getByText(/list-databases/)).to.exist;
      expect(screen.queryByText(/tool-list-databases/)).to.not.exist;
    });

    it('shows tool description when available', async function () {
      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={baseToolCall}
        />
      );

      const toolName = screen.getByText('list-databases');
      expect(toolName).to.exist;

      // InlineDefinition is used for tools with descriptions
      // list-databases should have a description from AVAILABLE_TOOLS
      userEvent.hover(toolName);
      await waitFor(() => {
        const description = screen.getByText(
          'Displays all available databases in the connected cluster.'
        );
        expect(description).to.exist;
      });
    });

    it('displays tool name without description for unknown tools', function () {
      const unknownToolCall: ToolUIPart = {
        ...baseToolCall,
        type: 'tool-unknown-tool',
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={unknownToolCall}
        />
      );

      expect(screen.getByText(/unknown-tool/)).to.exist;
    });
  });

  describe('connection chip', function () {
    it('displays connection name chip when connection is provided', function () {
      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={baseToolCall}
        />
      );

      expect(screen.getByText(defaultConnection.name)).to.exist;
    });

    it('does not display connection chip when connection is null', function () {
      render(<ToolCallMessage connection={null} toolCall={baseToolCall} />);

      expect(screen.queryByText(defaultConnection.name)).to.not.exist;
    });

    it('does not display connection chip for get-current- tools', function () {
      const toolCall: ToolUIPart = {
        ...baseToolCall,
        type: 'tool-get-current-query',
      };

      render(
        <ToolCallMessage connection={defaultConnection} toolCall={toolCall} />
      );

      expect(screen.queryByText(defaultConnection.name)).to.not.exist;
    });
  });

  describe('tool call states', function () {
    it('renders title "Run tool?" for approval-requested state', function () {
      const approvalToolCall: ToolUIPart = {
        ...baseToolCall,
        state: 'approval-requested',
        approval: { id: 'approval-1' },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={approvalToolCall}
        />
      );

      expect(screen.getByText(containsText('Run list-databases?'))).to.exist;
    });

    it('renders title "Running tool" for approval-responded state', function () {
      const runningToolCall: ToolUIPart = {
        ...baseToolCall,
        state: 'approval-responded',
        approval: { id: 'approval-1', approved: true },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={runningToolCall}
        />
      );

      expect(screen.getByText(containsText('Running list-databases'))).to.exist;
    });

    // TODO: hmm..
    it('renders title "Run tool?" for input-available state', function () {
      const runningToolCall: ToolUIPart = {
        ...baseToolCall,
        state: 'input-available',
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={runningToolCall}
        />
      );

      expect(screen.getByText(containsText('Run list-databases?'))).to.exist;
    });

    it('renders title "Ran tool" for output-available state', function () {
      const completedToolCall: ToolUIPart = {
        ...baseToolCall,
        state: 'output-available',
        output: { databases: [] },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={completedToolCall}
        />
      );

      expect(screen.getByText(containsText('Ran list-databases'))).to.exist;
    });

    it('renders title "Cancelled tool" for output-denied state', function () {
      const deniedToolCall: ToolUIPart = {
        ...baseToolCall,
        state: 'output-denied',
        approval: { id: 'approval-1', approved: false },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={deniedToolCall}
        />
      );

      expect(screen.getByText(containsText('Cancelled list-databases'))).to
        .exist;
    });

    it('renders null for input-streaming state', function () {
      const streamingToolCall: ToolUIPart = {
        ...baseToolCall,
        state: 'input-streaming',
      };

      const { container } = render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={streamingToolCall}
        />
      );

      expect(container.firstChild).to.be.null;
    });
  });

  describe('expandable content', function () {
    it('expands automatically if there are input arguments', function () {
      const toolWithArgs: ToolUIPart = {
        ...baseToolCall,
        input: { database: 'test-db', collection: 'test-coll' },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={toolWithArgs}
        />
      );

      expect(screen.getByText(/Arguments/)).to.exist;
      expect(screen.getByText(/"database"/)).to.exist;
      expect(screen.getByText(/"test-db"/)).to.exist;

      const collapseButton = screen.getByLabelText(
        'Collapse additional content'
      );
      userEvent.click(collapseButton);

      const expandButton = screen.getByLabelText('Expand additional content');
      userEvent.click(expandButton);
    });

    it('does not expand automatically if there are no input arguments', function () {
      const toolWithArgs: ToolUIPart = {
        ...baseToolCall,
        input: {},
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={toolWithArgs}
        />
      );

      const expandButton = screen.getByLabelText('Expand additional content');
      userEvent.click(expandButton);

      const collapseButton = screen.getByLabelText(
        'Collapse additional content'
      );
      userEvent.click(collapseButton);
    });

    it('displays tool output when available', function () {
      const toolWithOutput: ToolUIPart = {
        ...baseToolCall,
        state: 'output-available',
        output: { databases: ['db1', 'db2'] },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={toolWithOutput}
        />
      );

      expect(screen.getByText(/Response/)).to.exist;
      expect(screen.getByText(/"databases"/)).to.exist;
      expect(screen.getByText(/"db1"/)).to.exist;
    });

    it('displays error text when present', function () {
      const toolWithError: ToolUIPart = {
        ...baseToolCall,
        state: 'output-error',
        errorText: 'Connection timeout',
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={toolWithError}
        />
      );

      expect(screen.getByText(/Error/)).to.exist;
      expect(screen.getByText(/Connection timeout/)).to.exist;
    });
  });

  describe('approval actions', function () {
    it('shows Run and Cancel buttons when approval is requested', function () {
      const approvalTool: ToolUIPart = {
        ...baseToolCall,
        state: 'approval-requested',
        approval: { id: 'approval-1', approved: undefined },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={approvalTool}
        />
      );

      expect(screen.getByText('Run')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;
    });

    it('calls onApprove when Run button is clicked', function () {
      const onApprove = sinon.stub();
      const onDeny = sinon.stub();
      const approvalTool: ToolUIPart = {
        ...baseToolCall,
        state: 'approval-requested',
        approval: { id: 'approval-1', approved: undefined },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={approvalTool}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      );

      const runButton = screen.getByText('Run');
      userEvent.click(runButton);

      expect(onApprove.calledOnce).to.be.true;
      expect(onApprove.calledWith('approval-1')).to.be.true;
      expect(onDeny.notCalled).to.be.true;
    });

    it('calls onDeny when Cancel button is clicked', function () {
      const onApprove = sinon.stub();
      const onDeny = sinon.stub();
      const approvalTool: ToolUIPart = {
        ...baseToolCall,
        state: 'approval-requested',
        approval: { id: 'approval-1', approved: undefined },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={approvalTool}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      userEvent.click(cancelButton);

      expect(onDeny.calledOnce).to.be.true;
      expect(onDeny.calledWith('approval-1')).to.be.true;
      expect(onApprove.notCalled).to.be.true;
    });

    it('does not show action buttons when not awaiting approval', function () {
      const runningTool: ToolUIPart = {
        ...baseToolCall,
        state: 'input-available',
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={runningTool}
        />
      );

      expect(screen.queryByText('Run')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
    });

    it('does not show action buttons after approval is granted', function () {
      const approvedTool: ToolUIPart = {
        ...baseToolCall,
        state: 'approval-responded',
        approval: { id: 'approval-1', approved: true },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={approvedTool}
        />
      );

      expect(screen.queryByText('Run')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
    });
  });

  describe('edge cases', function () {
    it('handles empty input object', function () {
      const toolWithEmptyInput: ToolUIPart = {
        ...baseToolCall,
        input: {},
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={toolWithEmptyInput}
        />
      );

      // Should render without errors
      expect(screen.getByText(/list-databases/)).to.exist;
    });

    it('handles undefined input', function () {
      const toolWithUndefinedInput: ToolUIPart = {
        ...baseToolCall,
        input: undefined,
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={toolWithUndefinedInput}
        />
      );

      // Should render without errors
      expect(screen.getByText(/list-databases/)).to.exist;
    });

    it('handles null output', function () {
      const toolWithNullOutput: ToolUIPart = {
        ...baseToolCall,
        state: 'output-available',
        output: null,
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={toolWithNullOutput}
        />
      );

      // Should render without errors
      expect(screen.getByText(containsText('Ran list-databases'))).to.exist;
    });

    it('handles complex nested input and output', function () {
      const complexTool: ToolUIPart = {
        ...baseToolCall,
        state: 'output-available',
        input: {
          database: 'test',
          filter: { age: { $gte: 18 } },
          options: { limit: 10 },
        },
        output: {
          results: [
            { name: 'John', age: 25 },
            { name: 'Jane', age: 30 },
          ],
        },
      };

      render(
        <ToolCallMessage
          connection={defaultConnection}
          toolCall={complexTool}
        />
      );

      // Should render complex JSON properly
      expect(screen.getByText(/"database"/)).to.exist;
      expect(screen.getByText(/"filter"/)).to.exist;
      expect(screen.getByText(/"results"/)).to.exist;
    });
  });
});
