import React from 'react';
import { render } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import ConnectingAnimation from './connecting-animation';

describe('ConnectingAnimation Component', function () {
  describe('when rendered', function () {
    let unmountComponent;
    let cancelAnimationFrameSpy;
    let requestAnimationFrameSpy;

    beforeEach(function () {
      requestAnimationFrameSpy = sinon.spy(window.requestAnimationFrame);
      cancelAnimationFrameSpy = sinon.spy(window.cancelAnimationFrame);

      sinon.replace(window, 'requestAnimationFrame', requestAnimationFrameSpy);
      sinon.replace(window, 'cancelAnimationFrame', cancelAnimationFrameSpy);

      const { unmount } = render(<ConnectingAnimation />);
      unmountComponent = unmount;
    });
    afterEach(function () {
      unmountComponent = null;
      sinon.restore();
    });

    it('calls to request an animation frame', function () {
      expect(requestAnimationFrameSpy.called).to.equal(true);
    });

    it('does not call to cancelAnimationFrame', function () {
      expect(cancelAnimationFrameSpy.called).to.equal(false);
    });

    describe('when unmounted', function () {
      beforeEach(function () {
        unmountComponent();
      });

      it('calls to cancels the request animation frame', function () {
        expect(cancelAnimationFrameSpy.called).to.equal(true);
      });
    });
  });
});
