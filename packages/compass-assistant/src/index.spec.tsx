import React from 'react';
import { render } from '@mongodb-js/testing-library-compass';
import { CompassAssistantProvider } from './index';

describe('Compass Assistant', function () {
  const CompassAssistant = CompassAssistantProvider.withMockServices({});

  it('renders a Plugin', function () {
    render(<CompassAssistant></CompassAssistant>);
  });
});
