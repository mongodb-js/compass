import React from 'react';
import { expect } from 'chai';
import { render } from '@mongodb-js/testing-library-compass';
import { DataModelingWorkspaceTab } from './index';

describe('Compass Plugin', function () {
  const Plugin = DataModelingWorkspaceTab.provider.withMockServices({});

  it('renders a Plugin', function () {
    expect(() =>
      render(
        <Plugin>
          <DataModelingWorkspaceTab.content />
        </Plugin>
      )
    ).to.not.throw();
  });
});
