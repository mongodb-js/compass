import React from 'react';
import { expect } from 'chai';
import { EventEmitter } from 'events';
import { WorkspaceTab } from './index';
import {
  renderWithActiveConnection,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { RuntimeMap } from './stores/store';

describe('CompassShellPlugin WorkspaceTab', function () {
  it('returns a renderable plugin', async function () {
    RuntimeMap.set('test', {
      eventEmitter: new EventEmitter(),
      terminate() {},
      evaluate() {
        return Promise.resolve({});
      },
    } as any);

    const ShellContentComponent = WorkspaceTab.content;
    await renderWithActiveConnection(
      <WorkspaceTab.provider runtimeId="test">
        <ShellContentComponent />
      </WorkspaceTab.provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('shell-section')).to.exist;
    });
  });
});
