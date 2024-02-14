import React from 'react';
import { once } from 'events';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import { ipcRenderer } from 'hadron-ipc';
import sinon from 'sinon';
import { CompassHomePlugin } from './index';
import {
  CompassPipelineStorage,
  compassFavoriteQueryStorageAccess,
  compassRecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage';

const createDataService = () => ({
  getConnectionString() {
    return { hosts: ['localhost:27020'] };
  },
  getConnectionOptions() {
    return {};
  },
  getMongoClientConnectionOptions() {
    return {};
  },
  getLastSeenTopology() {
    return {
      type: 'Unknown',
      servers: ['localhost:27020'],
      setName: 'foo',
    };
  },
  configuredKMSProviders() {
    return [];
  },
  currentOp() {},
  top() {},
  on() {},
  off() {},
  removeListener() {},
});

describe('Home [Component]', function () {
  const testAppRegistry = new AppRegistry();

  const Home = CompassHomePlugin.withMockServices({
    globalAppRegistry: testAppRegistry,
    localAppRegistry: testAppRegistry,
    pipelineStorage: new CompassPipelineStorage(),
    favoriteQueryStorageAccess: compassFavoriteQueryStorageAccess,
    recentQueryStorageAccess: compassRecentQueryStorageAccess,
  });

  before(function () {
    // Skip these tests if we're not running in an electron runtime.
    if (!process.versions.electron) {
      this.skip();
    }
  });

  afterEach(cleanup);

  describe('is not connected', function () {
    beforeEach(function () {
      render(<Home appName="home-testing" />);
    });

    it('renders the connect screen', function () {
      expect(screen.getByTestId('connections')).to.be.visible;
    });
  });

  describe('is connected', function () {
    async function renderHome(
      dataService = createDataService(),
      connectionOptions = { connectionString: 'mongodb+srv://mongodb.net/' }
    ) {
      render(<Home appName="home-testing" />);
      testAppRegistry.emit('data-service-connected', null, dataService, {
        connectionOptions,
      });
      await waitFor(() => screen.getByTestId('home'));
    }

    describe('when UI status is complete', function () {
      let dataServiceDisconnectedSpy: sinon.SinonSpy;
      let listenForDisconnectFake: sinon.SinonSpy;

      beforeEach(async function () {
        listenForDisconnectFake = sinon.fake();
        testAppRegistry.on(
          'data-service-disconnected',
          listenForDisconnectFake
        );
        dataServiceDisconnectedSpy = sinon.fake.resolves(true);
        const dataService = {
          ...createDataService(),
          disconnect: dataServiceDisconnectedSpy,
          addReauthenticationHandler: sinon.stub(),
        };
        await renderHome(dataService);
      });

      afterEach(function () {
        testAppRegistry.removeListener(
          'data-service-disconnected',
          listenForDisconnectFake
        );
        sinon.restore();
      });

      describe('on `app:disconnect`', function () {
        // Skip disconnect testing when we're not running in a renderer instance.
        // eslint-disable-next-line mocha/no-setup-in-describe
        if (!ipcRenderer) {
          // eslint-disable-next-line mocha/no-setup-in-describe, no-console
          console.warn(
            'Skipping "app:disconnect" ipc event tests on non-renderer environment.'
          );
          return this;
        }

        beforeEach(async function () {
          ipcRenderer?.emit('app:disconnect');
          await once(testAppRegistry, 'data-service-disconnected');
        });

        it('calls `data-service-disconnected`', function () {
          expect(listenForDisconnectFake.callCount).to.equal(1);
        });

        it('renders the new connect form', function () {
          expect(screen.queryByTestId('connections-wrapper')).to.be.visible;
        });

        it('calls to disconnect the data service', function () {
          expect(dataServiceDisconnectedSpy.callCount).to.equal(1);
        });
      });
    });
  });

  describe('when rendered', function () {
    beforeEach(function () {
      render(<Home appName="home-testing" />);
    });

    it('adds all the listeners', function () {
      const events = ['data-service-connected', 'data-service-disconnected'];

      events.forEach((name) => {
        expect(testAppRegistry.listeners(name)).to.have.lengthOf(1);
      });
    });
  });

  describe('on dismount', function () {
    beforeEach(function () {
      const { unmount } = render(<Home appName="home-testing" />);
      unmount();
    });

    it('clears up all the listeners', function () {
      const events = [
        'data-service-connected',
        'data-service-disconnected',
        'darkmode-enable',
        'darkmode-disable',
      ];

      events.forEach((name) => {
        expect(testAppRegistry.listeners(name)).to.have.lengthOf(0);
      });
    });
  });
});
