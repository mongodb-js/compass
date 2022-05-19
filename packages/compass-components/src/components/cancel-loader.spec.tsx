import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';

import { fireEvent, render, screen, cleanup } from '@testing-library/react';

import CancelLoader from './cancel-loader';

function renderLoader(spy) {
  return render(
    <CancelLoader
      data-testid="my-test-id"
      progressText="Doing something"
      cancelText="Stop doing it"
      onCancel={spy}
    />
  );
}

describe('CancelLoader Component', function () {
  let spy;

  beforeEach(function () {
    spy = sinon.spy();
  });

  afterEach(function () {
    cleanup();
  });

  it('should show the loader', function () {
    renderLoader(spy);

    expect(screen.getByTestId('my-test-id')).to.exist;
    expect(screen.getByText('Doing something')).to.exist;
    const button = screen.getByText('Stop doing it');
    fireEvent.click(button);
    expect(spy.callCount).to.equal(1);
  });
});
