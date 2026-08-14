import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { ActionCardMessage } from './action-card-message';
import type { ActionCardButton } from './action-card-message';
import { expect } from 'chai';
import sinon from 'sinon';

describe('ActionCardMessage', function () {
  const defaultButtons: ActionCardButton[] = [
    {
      label: 'Cancel',
      variant: 'default',
      onClick: () => {},
    },
    {
      label: 'Run',
      variant: 'primary',
      onClick: () => {},
      isPrimary: true,
    },
  ];

  describe('title and content', function () {
    it('renders the title', function () {
      render(
        <ActionCardMessage state="idle" title="A helpful title">
          Some content
        </ActionCardMessage>
      );

      expect(screen.getByText('A helpful title')).to.exist;
    });

    it('renders a ReactNode title', function () {
      render(
        <ActionCardMessage
          state="idle"
          title={<span data-testid="custom-title">Custom title</span>}
        >
          Some content
        </ActionCardMessage>
      );

      expect(screen.getByTestId('custom-title')).to.exist;
    });

    it('renders the (markdown) children as content', function () {
      render(
        <ActionCardMessage state="idle" title="Title">
          {'Plain body text'}
        </ActionCardMessage>
      );

      expect(screen.getByText('Plain body text')).to.exist;
    });

    it('renders markdown content as formatted elements', function () {
      render(
        <ActionCardMessage state="success" title="Title">
          {'### Arguments\n\n```json\n{ "foo": "bar" }\n```'}
        </ActionCardMessage>
      );

      expect(screen.getByText(/Arguments/)).to.exist;
      expect(screen.getByText(/"foo"/)).to.exist;
    });
  });

  describe('chips', function () {
    it('renders provided chips', function () {
      render(
        <ActionCardMessage
          state="idle"
          title="Title"
          chips={[{ label: 'my-chip' }]}
        >
          content
        </ActionCardMessage>
      );

      expect(screen.getByText('my-chip')).to.exist;
    });
  });

  describe('expandable content', function () {
    it('is expanded by default', function () {
      render(
        <ActionCardMessage state="idle" title="Title">
          {'Visible content'}
        </ActionCardMessage>
      );

      expect(screen.getByText('Visible content')).to.exist;
      expect(screen.getByLabelText('Collapse additional content')).to.exist;
    });

    it('is collapsed when initialIsExpanded is false', function () {
      render(
        <ActionCardMessage state="idle" title="Title" initialIsExpanded={false}>
          {'Hidden content'}
        </ActionCardMessage>
      );

      expect(screen.getByLabelText('Expand additional content')).to.exist;
    });

    it('can be toggled by the user', function () {
      render(
        <ActionCardMessage state="idle" title="Title" initialIsExpanded={false}>
          {'Toggle content'}
        </ActionCardMessage>
      );

      userEvent.click(screen.getByLabelText('Expand additional content'));
      expect(screen.getByLabelText('Collapse additional content')).to.exist;

      userEvent.click(screen.getByLabelText('Collapse additional content'));
      expect(screen.getByLabelText('Expand additional content')).to.exist;
    });
  });

  describe('actions', function () {
    it('does not render buttons when showActions is false', function () {
      render(
        <ActionCardMessage
          state="idle"
          title="Title"
          buttons={defaultButtons}
          showActions={false}
        >
          content
        </ActionCardMessage>
      );

      expect(screen.queryByText('Run')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
    });

    it('does not render buttons by default (showActions defaults to false)', function () {
      render(
        <ActionCardMessage state="idle" title="Title" buttons={defaultButtons}>
          content
        </ActionCardMessage>
      );

      expect(screen.queryByText('Run')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
    });

    it('renders the buttons when showActions is true', function () {
      render(
        <ActionCardMessage
          state="idle"
          title="Title"
          buttons={defaultButtons}
          showActions
        >
          content
        </ActionCardMessage>
      );

      expect(screen.getByText('Run')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;
    });

    it('renders no buttons when the buttons array is empty', function () {
      render(
        <ActionCardMessage state="idle" title="Title" buttons={[]} showActions>
          content
        </ActionCardMessage>
      );

      expect(screen.queryByRole('button', { name: 'Run' })).to.not.exist;
    });

    it('calls onClick for the button that is clicked', function () {
      const onPrimary = sinon.stub();
      const onSecondary = sinon.stub();

      render(
        <ActionCardMessage
          state="idle"
          title="Title"
          showActions
          buttons={[
            { label: 'Cancel', variant: 'default', onClick: onSecondary },
            {
              label: 'Run',
              variant: 'primary',
              onClick: onPrimary,
              isPrimary: true,
            },
          ]}
        >
          content
        </ActionCardMessage>
      );

      userEvent.click(screen.getByText('Run'));
      expect(onPrimary).to.have.been.calledOnce;
      expect(onSecondary).to.not.have.been.called;

      userEvent.click(screen.getByText('Cancel'));
      expect(onSecondary).to.have.been.calledOnce;
      expect(onPrimary).to.have.been.calledOnce;
    });

    it('focuses the primary button when actions are shown', async function () {
      render(
        <ActionCardMessage
          state="idle"
          title="Title"
          showActions
          focusPrimaryKey="approval-1"
          buttons={defaultButtons}
        >
          content
        </ActionCardMessage>
      );

      const runButton = screen.getByRole('button', { name: /Run/ });
      await waitFor(() => {
        expect(document.activeElement).to.equal(runButton);
      });
    });

    it('refocuses the primary button when focusPrimaryKey changes', async function () {
      const { rerender } = render(
        <ActionCardMessage
          state="idle"
          title="Title"
          showActions
          focusPrimaryKey="approval-1"
          buttons={defaultButtons}
        >
          content
        </ActionCardMessage>
      );

      const runButton = screen.getByRole('button', { name: /Run/ });
      await waitFor(() => {
        expect(document.activeElement).to.equal(runButton);
      });

      // Move focus away, then change the key to trigger a refocus.
      (document.activeElement as HTMLElement | null)?.blur();
      expect(document.activeElement).to.not.equal(runButton);

      rerender(
        <ActionCardMessage
          state="idle"
          title="Title"
          showActions
          focusPrimaryKey="approval-2"
          buttons={defaultButtons}
        >
          content
        </ActionCardMessage>
      );

      await waitFor(() => {
        expect(document.activeElement).to.equal(
          screen.getByRole('button', { name: /Run/ })
        );
      });
    });
  });
});
