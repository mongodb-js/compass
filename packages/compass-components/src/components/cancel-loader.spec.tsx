import React from 'react';
import sinon from 'sinon';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'chai';

import CancelLoader from './cancel-loader';

function renderLoader(spy) {
  return render(
    <CancelLoader
      dataTestId="my-test-id"
      progressText="Doing something"
      cancelText="Stop doing it"
      cancelClicked={spy}
    />
  );
}

describe('ConfirmationModal Component', function () {
  let spy;

  beforeEach(function () {
    spy = sinon.spy();
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
