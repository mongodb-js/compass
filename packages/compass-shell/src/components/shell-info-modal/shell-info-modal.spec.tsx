import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import ShellInfoModal from './shell-info-modal';

describe('InfoModal [Component]', function () {
  beforeEach(function () {
    render(
      <ShellInfoModal show hideInfoModal={() => {}} mongoshVersion="v2.3.456" />
    );
  });

  it('renders the title text', function () {
    expect(screen.getByText(/^mongosh v2\.\d+\.\d+/)).to.be.visible;
  });

  it('renders the hotkeys key', function () {
    expect(screen.getAllByText('Ctrl').at(0)).to.be.visible;
  });

  it('renders the hotkeys description', function () {
    expect(screen.getByText('Moves the cursor Forward one character.')).to.be
      .visible;
  });
});
