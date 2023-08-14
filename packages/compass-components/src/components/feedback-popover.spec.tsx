import React, { useState } from 'react';
import { expect } from 'chai';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { FeedbackPopover } from './feedback-popover';

function FeedbackPopoverRenderer(
  props: Partial<React.ComponentProps<typeof FeedbackPopover>>
) {
  const buttonRef = React.createRef<any>();
  const [open, setOpen] = useState(false);

  return (
    <div>
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
    fireEvent.change(textArea, {
      target: { value: 'pineapple' },
    });

    screen.getByText('Submit').click();
    // Wait for the event to go through.
    await new Promise((resolve) => setTimeout(resolve, 3));

    expect(feedbackText).to.equal('pineapple');
  });
});
