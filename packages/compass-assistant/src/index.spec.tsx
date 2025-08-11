import React from 'react';
import { render } from '@mongodb-js/testing-library-compass';
import CompassAssistant from './index';

describe('Compass Assistant', function () {
  const Plugin = CompassAssistant.withMockServices({});

  it('renders a Plugin', function () {
    render(<Plugin></Plugin>);
  });
});
