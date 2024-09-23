import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { CompassGlobalWritesPlugin } from '../index';

describe('Compass GlobalWrites Plugin', function () {
  const Plugin = CompassGlobalWritesPlugin.provider.withMockServices({});
  it('renders a Plugin', function () {
    render(<Plugin />);
    expect(screen.findByText('This feature is currently in development.')).to
      .exist;
  });
});
