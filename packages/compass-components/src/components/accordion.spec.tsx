import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import { fireEvent, render, screen, cleanup } from '@testing-library/react';

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
  afterEach(function () {
    cleanup();
  });

  it('should open the accordion on click', function () {
    renderAccordion();

    expect(screen.getByTestId('my-test-id')).to.exist;
    const button = screen.getByText('Accordion Test');
    fireEvent.click(button);
    expect(screen.getByText('Hello World')).to.be.visible;
  });

  it('should close the accordion after clicking to open then close', function () {
    renderAccordion();

    expect(screen.getByTestId('my-test-id')).to.exist;
    const button = screen.getByText('Accordion Test');
    fireEvent.click(button);
    expect(screen.getByText('Hello World')).to.be.visible;
    fireEvent.click(button);
    expect(screen.queryByText('Hello World')).to.not.exist;
  });

  it('should show a hint', function () {
    renderAccordion({
      hintText: 'hint test',
    });

    expect(screen.getByText('hint test')).to.be.visible;
  });

  it('should call the onOpen prop when opened', function () {
    const onOpenFake = sinon.fake();
    renderAccordion({
      onOpen: onOpenFake,
    });

    expect(onOpenFake.calledOnce).to.be.false;

    const button = screen.getByText('Accordion Test');
    fireEvent.click(button);
    expect(onOpenFake.calledOnce).to.be.true;
    fireEvent.click(button);

    expect(onOpenFake.calledOnce).to.be.true;
  });

  it('should call the onClose prop when closed', function () {
    const onCloseFake = sinon.fake();
    renderAccordion({
      onClose: onCloseFake,
    });

    expect(onCloseFake.calledOnce).to.be.false;

    const button = screen.getByText('Accordion Test');
    fireEvent.click(button);
    expect(onCloseFake.calledOnce).to.be.false;
    fireEvent.click(button);

    expect(onCloseFake.calledOnce).to.be.true;
  });
});
