import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

describe('useCopyPasteContextMenu', function () {
  afterEach(function () {
    sinon.restore();
  });

  const TestComponent = () => {
    // The copy-paste functionality is already provided through the
    // test rendering hook. So we only render a few elements
    // that can be interacted with.
    return (
      <div data-testid="test-container">
        <input
          data-testid="test-input"
          type="text"
          defaultValue="Hello World"
        />
        <textarea data-testid="test-textarea" defaultValue="Textarea content" />
        <div data-testid="test-readonly">Read-only content</div>
      </div>
    );
  };

  describe('without the clipboard API', function () {
    it('does not show any actions', function () {
      sinon.replaceGetter(
        global,
        'navigator',
        (() => ({})) as unknown as () => typeof global.navigator
      );

      render(<TestComponent />);

      const testInput: HTMLInputElement = screen.getByTestId('test-input');
      userEvent.click(testInput);
      testInput.setSelectionRange(0, 5);

      userEvent.click(testInput, { button: 2 });

      expect(screen.queryByText('Cut')).to.not.exist;
      expect(screen.queryByText('Copy')).to.not.exist;
      expect(screen.queryByText('Paste')).to.not.exist;
    });
  });

  describe('with stubbed clipboard actions', function () {
    let mockClipboard: {
      writeText: sinon.SinonStub;
      readText: sinon.SinonStub;
    };
    let setExecCommand: boolean = false;
    beforeEach(function () {
      mockClipboard = {
        writeText: sinon.stub().resolves(),
        readText: sinon.stub().resolves('pasted text'),
      };

      // The execCommand doesn't exist in the testing environment.
      // https://github.com/jsdom/jsdom/issues/1742
      if (!document.execCommand) {
        setExecCommand = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).execCommand = () => true;
      }
      sinon.stub(document, 'execCommand').returns(true);
      sinon
        .stub(global.navigator.clipboard, 'writeText')
        .callsFake(mockClipboard.writeText);
      sinon
        .stub(global.navigator.clipboard, 'readText')
        .callsFake(mockClipboard.readText);
    });

    afterEach(function () {
      sinon.restore();
      if (setExecCommand) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (document as any).execCommand;
        setExecCommand = false;
      }
    });

    describe('context menu visibility', function () {
      it('shows paste when focusing editable element', async function () {
        render(<TestComponent />);

        const input = screen.getByTestId('test-input');
        userEvent.click(input);
        userEvent.click(input, { button: 2 });

        await waitFor(() => {
          // No selection, so no cut/copy.
          expect(screen.queryByText('Cut')).to.not.exist;
          expect(screen.queryByText('Copy')).to.not.exist;

          expect(screen.getByText('Paste')).to.be.visible;
        });
      });
    });

    describe('clipboard operations', function () {
      it('calls clipboard writeText when copying', async function () {
        render(<TestComponent />);

        const testInput: HTMLInputElement = screen.getByTestId('test-input');
        userEvent.click(testInput);
        userEvent.type(testInput, '12345');

        testInput.setSelectionRange(6, 14);

        const selectedText = testInput.value.substring(
          testInput.selectionStart || 0,
          testInput.selectionEnd || 0
        );
        expect(selectedText).to.equal('World123');

        userEvent.click(testInput, { button: 2 });

        await waitFor(() => {
          expect(screen.getByText('Copy')).to.be.visible;
        });

        userEvent.click(screen.getByText('Copy'));

        await waitFor(() => {
          expect(mockClipboard.writeText).to.have.been.calledOnceWith(
            'World123'
          );
        });
      });

      it('calls clipboard writeText when cutting', async function () {
        render(<TestComponent />);

        const testInput: HTMLInputElement = screen.getByTestId('test-input');
        userEvent.click(testInput);
        userEvent.type(testInput, '12345');

        testInput.setSelectionRange(6, 14);

        const selectedText = testInput.value.substring(
          testInput.selectionStart || 0,
          testInput.selectionEnd || 0
        );
        expect(selectedText).to.equal('World123');

        userEvent.click(testInput, { button: 2 });

        await waitFor(() => {
          expect(screen.getByText('Cut')).to.be.visible;
        });

        userEvent.click(screen.getByText('Cut'));

        await waitFor(() => {
          expect(mockClipboard.writeText).to.have.been.calledWith('World123');
        });
      });

      it('calls clipboard readText when pasting', async function () {
        render(<TestComponent />);

        const input = screen.getByTestId('test-input');
        userEvent.click(input);
        userEvent.click(input, { button: 2 });

        await waitFor(() => {
          expect(screen.getByText('Paste')).to.be.visible;
        });

        expect(mockClipboard.readText).to.not.have.been.called;

        userEvent.click(screen.getByText('Paste'));

        await waitFor(() => {
          expect(mockClipboard.readText).to.have.been.called;
        });
      });

      it('handles clipboard errors gracefully', async function () {
        mockClipboard.readText.rejects(new Error('Permission denied'));

        render(<TestComponent />);

        const input = screen.getByTestId('test-input');
        userEvent.click(input);
        userEvent.click(input, { button: 2 });

        await waitFor(() => {
          const pasteButton = screen.getByText('Paste');

          expect(() => userEvent.click(pasteButton)).to.not.throw();
        });
      });
    });

    describe('element type detection', function () {
      it('detects input elements as editable', function () {
        render(<TestComponent />);

        const input = screen.getByTestId('test-input');
        userEvent.click(input);
        userEvent.click(input, { button: 2 });

        expect(screen.queryByText('Cut')).to.not.exist;
        expect(screen.getByText('Paste')).to.be.visible;
      });

      it('detects textarea elements as editable', function () {
        render(<TestComponent />);

        const textarea = screen.getByTestId('test-textarea');
        userEvent.click(textarea);
        userEvent.click(textarea, { button: 2 });

        expect(screen.queryByText('Cut')).to.not.exist;
        expect(screen.getByText('Paste')).to.be.visible;
      });

      it('detects readonly elements as non-editable for paste', function () {
        render(<TestComponent />);

        const readOnly = screen.getByTestId('test-readonly');
        userEvent.click(readOnly);
        userEvent.click(readOnly, { button: 2 });

        expect(screen.queryByText('Paste')).to.not.exist;
      });

      it('handles non-text input types', function () {
        render(<input data-testid="checkbox-input" type="checkbox" />);

        const input = screen.getByTestId('checkbox-input');
        userEvent.click(input);
        userEvent.click(input, { button: 2 });

        expect(screen.queryByText('Paste')).to.not.exist;
      });
    });
  });
});
