import React from 'react';
import { expect } from 'chai';
import { render } from '@mongodb-js/testing-library-compass';
import { CompassDataModelingPlugin } from './index';

describe('Compass Plugin', function () {
  const Plugin = CompassDataModelingPlugin.provider.withMockServices({});

  it('renders a Plugin', function () {
    expect(() =>
      render(
        <Plugin>
          <CompassDataModelingPlugin.content />
        </Plugin>
      )
    ).to.not.throw();
  });
});
