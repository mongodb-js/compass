import React from 'react';
import { expect } from 'chai';
import { render } from '@mongodb-js/testing-library-compass';
import { WorkspaceTab } from './index';

describe('Compass Plugin', function () {
  const Plugin = WorkspaceTab.provider.withMockServices({});

  it('renders a Plugin', function () {
    expect(() =>
      render(
        <Plugin>
          <WorkspaceTab.content />
        </Plugin>
      )
    ).to.not.throw();
  });
});
