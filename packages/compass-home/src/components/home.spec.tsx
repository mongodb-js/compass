import React from 'react';
import { once } from 'events';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import { AppRegistryProvider, globalAppRegistry } from 'hadron-app-registry';
import { ipcRenderer } from 'hadron-ipc';
import sinon from 'sinon';
import Home from '.';

const getComponent = (name: string) => {
  class TestComponent extends React.Component {
    render() {
      return React.createElement(
        'div',
        {
          'data-testid': `test-${name}`,
        },
        name
      );
    }
  }
  return TestComponent;
};

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
  on() {},
  off() {},
});

describe('Home [Component]', function () {
  before(function () {
    // Skip these tests if we're not running in an electron runtime.
    if (!process.versions.electron) {
      this.skip();
    }
  });

  const testAppRegistry = globalAppRegistry;

  beforeEach(function () {
    [
      'Collection.Workspace',
      'Database.Workspace',
      'Instance.Workspace',
    ].forEach((name) =>
      testAppRegistry.registerComponent(name, getComponent(name))
    );

    ['Application.Connect'].forEach((name) =>
      testAppRegistry.registerRole(name, {
        name,
        component: getComponent(name),
      })
    );

    testAppRegistry.onActivated();
  });

  afterEach(function () {
    testAppRegistry.deactivate();
    cleanup();
  });

  describe('is not connected', function () {
    beforeEach(function () {
      render(
        <AppRegistryProvider localAppRegistry={testAppRegistry}>
          <Home appName="home-testing" />
        </AppRegistryProvider>
      );
    });

    it('renders the connect screen', function () {
      expect(screen.getByTestId('connections-wrapper')).to.be.visible;
    });

    it('does not render the sidebar', function () {
      expect(screen.queryByTestId('test-Sidebar.Component')).to.not.exist;
    });
  });

  describe('is connected', function () {
    async function renderHome(
      dataService = createDataService(),
      connectionOptions = { connectionString: 'mongodb+srv://mongodb.net/' }
    ) {
      render(
        <AppRegistryProvider localAppRegistry={testAppRegistry}>
          <Home appName="home-testing" />
        </AppRegistryProvider>
      );
      testAppRegistry.emit('data-service-connected', null, dataService, {
        connectionOptions,
      });
      await waitFor(() =>
        expect(
          screen
            .queryAllByTestId('home-view')
            .map((el) => el.getAttribute('data-hidden'))
        ).to.include('true')
      );
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
        await waitFor(() => screen.getByTestId('test-Instance.Workspace'));
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
      render(
        <AppRegistryProvider localAppRegistry={testAppRegistry}>
          <Home appName="home-testing" />
        </AppRegistryProvider>
      );
    });

    it('adds all the listeners', function () {
      const events = [
        'data-service-connected',
        'data-service-disconnected',
        'select-database',
        'select-namespace',
        'open-instance-workspace',
        'open-namespace-in-new-tab',
      ];

      events.forEach((name) => {
        expect(testAppRegistry.listeners(name)).to.have.lengthOf(1);
      });
    });
  });

  describe('on dismount', function () {
    beforeEach(function () {
      const { unmount } = render(
        <AppRegistryProvider localAppRegistry={testAppRegistry}>
          <Home appName="home-testing" />
        </AppRegistryProvider>
      );
      unmount();
    });

    it('clears up all the listeners', function () {
      const events = [
        'data-service-connected',
        'data-service-disconnected',
        'select-database',
        'select-namespace',
        'open-instance-workspace',
        'open-namespace-in-new-tab',
        'darkmode-enable',
        'darkmode-disable',
      ];

      events.forEach((name) => {
        expect(testAppRegistry.listeners(name)).to.have.lengthOf(0);
      });
    });
  });
});
