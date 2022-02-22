import React from 'react';

import { render, cleanup } from '@testing-library/react';

import { SpinLoader } from './spin-loader';

function renderLoader() {
  return render(<SpinLoader size="12px" />);
}

describe('SpinLoader Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should show the spinner', function () {
    renderLoader();
  });
});
