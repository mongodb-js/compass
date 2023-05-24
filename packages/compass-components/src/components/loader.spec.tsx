import React from 'react';
import sinon from 'sinon';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { SpinLoader, CancelLoader } from './loader';
import { expect } from 'chai';

function renderLoader() {
  return render(<SpinLoader size="12px" />);
}

function renderCancelLoader(spy) {
  return render(
    <CancelLoader
      data-testid="my-test-id"
      progressText="Doing something"
      cancelText="Stop doing it"
      onCancel={spy}
    />
  );
}

describe('SpinLoader Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should show the spinner', function () {
    renderLoader();
  });

  describe('CancelLoader Component', function () {
    let spy;

    beforeEach(function () {
      spy = sinon.spy();
    });

    afterEach(function () {
      cleanup();
    });

    it('should show the loader', function () {
      renderCancelLoader(spy);

      expect(screen.getByTestId('my-test-id')).to.exist;
      expect(screen.getByText('Doing something')).to.exist;
      const button = screen.getByText('Stop doing it');
      fireEvent.click(button);
      expect(spy.callCount).to.equal(1);
    });
  });
});
