import React from 'react';
import { render } from '@mongodb-js/testing-library-compass';
import { CompassAssistantProvider } from './index';
import { expect } from 'chai';

describe('Compass Assistant', function () {
  const CompassAssistant = CompassAssistantProvider.withMockServices({});

  it('renders a Plugin', function () {
    expect(() => render(<CompassAssistant></CompassAssistant>)).to.not.throw;
  });
});
