import React from 'react';
import { expect } from 'chai';

import { fireEvent, render, screen, cleanup } from '@testing-library/react';

import Accordion from './accordion';

function renderAccordion() {
  return render(
    <Accordion
      dataTestId="my-test-id"
      text='Accordion Test'
    >
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
});