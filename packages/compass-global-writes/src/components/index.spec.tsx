import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { GlobalWrites } from './index';

describe('Compass GlobalWrites Plugin', function () {
  it('renders a Plugin', function () {
    render(<GlobalWrites />);
    expect(screen.getByText('This feature is currently in development.')).to
      .exist;
  });
});
