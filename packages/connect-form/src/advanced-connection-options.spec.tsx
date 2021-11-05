import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import AdvancedConnectionOptions from './advanced-connection-options';

function renderComponent() {
  return render(
    <AdvancedConnectionOptions />
  );
}

describe('ConnectForm Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should show the text', function () {
    renderComponent();
    expect(screen.getByRole('heading')).to.have.text('New Connection');
  });

});
