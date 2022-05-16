import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import Connecting from './connecting';

describe('Connecting Component', function () {
  let onCancelConnectionClickedSpy;

  beforeEach(function () {
    this.clock = sinon.useFakeTimers();
    onCancelConnectionClickedSpy = sinon.spy();
  });

  before(function () {
    sinon.replace(window, 'requestAnimationFrame', () => 0);
    sinon.replace(window, 'cancelAnimationFrame', () => 0);
  });

  afterEach(function () {
    this.clock.restore();
    // Modals can have delays and transitions so it's best to cleanup.
    cleanup();
  });

  after(function () {
    sinon.restore();
  });

  describe('when there is a connection attempt in progress', function () {
    beforeEach(function () {
      render(
        <Connecting
          connectingStatusText="Connecting..."
          onCancelConnectionClicked={onCancelConnectionClickedSpy}
        />
      );
    });

    it('shows the connecting background overlay', function () {
      expect(screen.queryByTestId('connecting-background-svg')).to.be.visible;
    });

    it('does not show the connecting modal yet', function () {
      expect(screen.queryByText('Cancel')).to.not.exist;
    });

    describe('after a slight delay', function () {
      beforeEach(function () {
        // Speedup the modal showing animation.
        this.clock.tick(300);
      });

      it('shows the connecting modal', function () {
        expect(screen.getByText('Cancel')).to.be.visible;
      });

      describe('when the cancel button is clicked', function () {
        beforeEach(function () {
          expect(onCancelConnectionClickedSpy.called).to.equal(false);

          const cancelButton = screen.getByText('Cancel');
          fireEvent.click(cancelButton);
        });

        it('calls onCancelConnectionClicked', function () {
          expect(onCancelConnectionClickedSpy.called).to.equal(true);
        });
      });
    });
  });
});
