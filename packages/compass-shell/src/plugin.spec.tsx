import React from 'react';
import { expect } from 'chai';
import { EventEmitter } from 'events';
import { CompassShellPlugin } from './index';
import {
  renderWithActiveConnection,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { RuntimeMap } from './stores/store';

describe('CompassShellPlugin', function () {
  it('returns a renderable plugin', async function () {
    RuntimeMap.set('test', {
      eventEmitter: new EventEmitter(),
      terminate() {},
    } as any);

    await renderWithActiveConnection(<CompassShellPlugin runtimeId="test" />);

    await waitFor(() => {
      expect(screen.getByTestId('shell-section')).to.exist;
    });
  });
});
