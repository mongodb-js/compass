import React, { useState } from 'react';
import { expect } from 'chai';

import { userEvent, render, screen } from '@mongodb-js/testing-library-compass';

import { Accordion } from './accordion';

function renderAccordion(
  props?: Partial<React.ComponentProps<typeof Accordion>>
) {
  return render(
    <Accordion data-testid="my-test-id" text="Accordion Test" {...props}>
      <h1>Hello World</h1>
    </Accordion>
  );
}

describe('Accordion Component', function () {
  it('should open the accordion on click', function () {
    renderAccordion();

    expect(screen.getByTestId('my-test-id')).to.exist;
    const summary = screen.getByText('Accordion Test');
    userEvent.click(summary);
    expect(summary.closest('details')).to.have.attribute('open');
  });

  it('should close the accordion on click - default open', function () {
    renderAccordion({
      defaultOpen: true,
    });

    expect(screen.getByTestId('my-test-id')).to.exist;
    const summary = screen.getByText('Accordion Test');
    expect(screen.getByText('Hello World')).to.be.visible;
    userEvent.click(summary);

    expect(summary.closest('details')).to.not.have.attribute('open');
  });

  it('should close the accordion after clicking to open then close', function () {
    renderAccordion();

    expect(screen.getByTestId('my-test-id')).to.exist;
    const summary = screen.getByText('Accordion Test');
    userEvent.click(summary);
    expect(summary.closest('details')).to.have.attribute('open');
    userEvent.click(summary);
    expect(summary.closest('details')).to.not.have.attribute('open');
  });

  it('should show a hint', function () {
    renderAccordion({
      hintText: 'hint test',
    });

    expect(screen.getByText('hint test')).to.be.visible;
  });

  it('should open with a single click after being programmatically closed', function () {
    function ControlledAccordion() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button data-testid="close-button" onClick={() => setOpen(false)}>
            Close
          </button>
          <Accordion
            data-testid="my-test-id"
            text="Accordion Test"
            open={open}
            onOpenToggle={setOpen}
          >
            <h1>Hello World</h1>
          </Accordion>
        </>
      );
    }

    render(<ControlledAccordion />);
    const summary = screen.getByText('Accordion Test');

    // Initially open
    expect(summary.closest('details')).to.have.attribute('open');

    // Programmatically close
    userEvent.click(screen.getByTestId('close-button'));
    expect(summary.closest('details')).to.not.have.attribute('open');

    // Click once to re-open — should work on the first click
    userEvent.click(summary);
    expect(summary.closest('details')).to.have.attribute('open');
  });
});
