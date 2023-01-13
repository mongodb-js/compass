import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import CompassFindInPage from './plugin';

import { toggleStatus } from './modules';
import store from './stores';

describe('CompassFindInPage [Component]', function () {
  beforeEach(function () {
    render(<CompassFindInPage />);
  });

  afterEach(cleanup);

  describe('when the component is rendered and status is enabled', function () {
    beforeEach(function () {
      store.dispatch(toggleStatus());
    });

    afterEach(function () {
      store.dispatch(toggleStatus());
    });

    it('should contain FindInPageInput', function () {
      expect(screen.getByTestId('find-in-page-form')).to.be.visible;
    });
  });

  describe('when the component is rendered and status is disabled', function () {
    it('should not contain FindInPageInput', function () {
      expect(screen.queryByTestId('find-in-page-form')).to.not.exist;
    });
  });
});
