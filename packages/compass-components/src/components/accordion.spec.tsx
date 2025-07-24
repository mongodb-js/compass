import React from 'react';
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
    const button = screen.getByText('Accordion Test');
    userEvent.click(button);
    expect(screen.getByText('Hello World')).to.be.visible;
  });

  it('should close the accordion on click - default open', function () {
    renderAccordion({
      defaultOpen: true,
    });

    expect(screen.getByTestId('my-test-id')).to.exist;
    const button = screen.getByText('Accordion Test');
    expect(screen.getByText('Hello World')).to.be.visible;
    userEvent.click(button);

    expect(screen.queryByText('Hello World')).not.to.exist;
  });

  it('should close the accordion after clicking to open then close', function () {
    renderAccordion();

    expect(screen.getByTestId('my-test-id')).to.exist;
    const button = screen.getByText('Accordion Test');
    userEvent.click(button);
    expect(screen.getByText('Hello World')).to.be.visible;
    userEvent.click(button);
    expect(screen.queryByText('Hello World')).to.not.exist;
  });

  it('should show a hint', function () {
    renderAccordion({
      hintText: 'hint test',
    });

    expect(screen.getByText('hint test')).to.be.visible;
  });
});
