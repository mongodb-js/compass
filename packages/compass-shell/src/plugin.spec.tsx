import React from 'react';
import { expect } from 'chai';
import { CompassShellPlugin } from './index';
import {
  cleanup,
  renderWithActiveConnection,
  screen,
  waitFor,
} from '@mongodb-js/compass-connections/test';

describe('CompassShellPlugin', function () {
  afterEach(() => {
    cleanup();
  });

  // TODO(COMPASS-7906): remove
  it.skip('returns a renderable plugin', async function () {
    await renderWithActiveConnection(<CompassShellPlugin />, undefined, {
      connectFn() {
        return {
          getMongoClientConnectionOptions() {
            return { url: '', options: {} };
          },
        };
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('shell-section')).to.exist;
    });
  });
});
