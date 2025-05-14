import React from 'react';
import { expect } from 'chai';
import { cleanup, render } from '@mongodb-js/testing-library-compass';
import CompassPlugin from './index';

describe('Compass Plugin', function () {
  const Plugin = CompassPlugin.withMockServices({});

  it('renders a Plugin', function () {
    render(<Plugin></Plugin>);
  });
});
