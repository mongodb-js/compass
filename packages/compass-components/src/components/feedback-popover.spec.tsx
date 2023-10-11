import React, { useState } from 'react';
import { expect } from 'chai';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FeedbackPopover } from './feedback-popover';

function FeedbackPopoverRenderer(
  props: Partial<React.ComponentProps<typeof FeedbackPopover>>
) {
  const buttonRef = React.createRef<any>();
  const [open, setOpen] = useState(false);

  return (
    <div data-testid="outside-modal-area">
      <button
        data-testid="open-feedback-button"
        ref={buttonRef}
        onClick={() => setOpen(!open)}
      >
        Feedback Button
      </button>
      <FeedbackPopover
        label="test"
        placeholder=""
        refEl={buttonRef}
        open={open}
        setOpen={setOpen}
        onSubmitFeedback={() => {
          /* no-op */
        }}
        {...props}
      />
    </div>
  );
}

const renderFeedbackPopover = (
  props: Partial<React.ComponentProps<typeof FeedbackPopover>>
) => {
  render(<FeedbackPopoverRenderer {...props} />);
};

describe('FeedbackPopover', function () {
  afterEach(function () {
    cleanup();
  });

  it('renders the popover and passes feedback when submitted', async function () {
    let feedbackText = '';
    renderFeedbackPopover({
      onSubmitFeedback: (text: string) => {
        feedbackText = text;
      },
    });

    expect(screen.queryByRole('textbox')).to.not.exist;

    screen.getByTestId('open-feedback-button').click();

    const textArea = screen.getByTestId('feedback-popover-textarea');
    expect(textArea).to.be.visible;
    userEvent.type(textArea, 'pineapple');

    screen.getByText('Submit').click();
    // Wait for the event to go through.
    await new Promise((resolve) => setTimeout(resolve, 3));

    expect(feedbackText).to.equal('pineapple');
  });

  it('renders the popover and passes feedback with no text when the popover closed without submitting', async function () {
    let feedbackText = '';
    renderFeedbackPopover({
      onSubmitFeedback: (text: string) => {
        feedbackText = text;
      },
    });

    expect(screen.queryByRole('textbox')).to.not.exist;

    const outsideModal = screen.getByTestId('outside-modal-area');
    userEvent.click(outsideModal);

    // Wait for the event to go through.
    await new Promise((resolve) => setTimeout(resolve, 3));

    expect(feedbackText).to.equal('');
  });

  it('renders the popover and passes feedback with no text when user presses esc', async function () {
    let feedbackText = '';
    renderFeedbackPopover({
      onSubmitFeedback: (text: string) => {
        feedbackText = text;
      },
    });

    expect(screen.queryByRole('textbox')).to.not.exist;

    userEvent.keyboard('{Escape}');

    // Wait for the event to go through.
    await new Promise((resolve) => setTimeout(resolve, 3));

    expect(feedbackText).to.equal('');
  });
});
