import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import InstanceModel from 'mongodb-instance-model';

import AppRegistryContext from '../contexts/app-registry-context';
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

const createDataService = () => ({});

const createInstance = (initialState = {}) => new InstanceModel(initialState);

describe('Home [Component]', function () {
  let testAppRegistry: AppRegistry;
  beforeEach(function () {
    testAppRegistry = new AppRegistry();
    ['Sidebar.Component', 'Global.Shell'].map((name) =>
      testAppRegistry.registerComponent(name, getComponent(name))
    );

    [
      'Collection.Workspace',
      'Database.Workspace',
      'Instance.Workspace',
      'Find',
      'Global.Modal',
      'Application.Connect',
    ].map((name) =>
      testAppRegistry.registerRole(name, {
        name,
        component: getComponent(name),
      })
    );
    testAppRegistry.onActivated();
  });

  afterEach(function () {
    cleanup();
  });

  describe('is not connected', function () {
    beforeEach(function () {
      render(
        <AppRegistryContext.Provider value={testAppRegistry}>
          <Home appName="home-testing" />
        </AppRegistryContext.Provider>
      );
    });

    it('renders the connect screen', function () {
      expect(screen.getByTestId('test-Application.Connect')).to.be.visible;
    });

    it('does not render the sidebar', function () {
      expect(screen.queryByTestId('test-Sidebar.Component')).to.not.exist;
    });
  });

  describe('is connected', function () {
    async function renderHome(
      dataService = createDataService(),
      instance = createInstance(),
      connectionOptions = { connectionString: 'mongodb+srv://mongodb.net/' }
    ) {
      render(
        <AppRegistryContext.Provider value={testAppRegistry}>
          <Home appName="home-testing" />
        </AppRegistryContext.Provider>
      );
      testAppRegistry.emit('data-service-connected', null, dataService, {
        connectionOptions,
      });
      testAppRegistry.emit('instance-created', { instance });
      await waitFor(
        () =>
          expect(screen.queryByTestId('test-Application.Connect')).to.not.exist
      );
    }

    describe('UI status is loading', function () {
      beforeEach(async function () {
        await renderHome(createDataService(), createInstance());
      });

      it('renders content correctly', function () {
        expect(screen.queryByTestId('test-Instance.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Database.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Collection.Workspace')).to.not.exist;
      });
      it('renders the sidebar', function () {
        expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
      });
      it('renders the find', function () {
        expect(screen.getByTestId('test-Find')).to.be.visible;
      });
      it('renders the shell plugin', function () {
        expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
      });
      it('renders the global modal role', function () {
        expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
      });
      it('updates the document title', async function () {
        await waitFor(() =>
          expect(document.title).to.equal('home-testing - mongodb.net')
        );
      });

      describe('on `data-service-disconnected`', function () {
        beforeEach(async function () {
          testAppRegistry.emit('data-service-disconnected');

          await waitFor(
            () =>
              expect(screen.queryByTestId('test-Sidebar.Component')).to.not
                .exist
          );
        });

        it('renders the connect screen', function () {
          expect(screen.getByTestId('test-Application.Connect')).to.be.visible;
        });
      });
    });

    describe('UI status is error', function () {
      beforeEach(async function () {
        const instance = createInstance();
        await renderHome(createDataService(), instance);
        instance.set({
          status: 'error',
          statusError: 'Test error message',
          refreshingStatus: 'error',
          refreshingStatusError: 'Test error message',
        });
        await waitFor(() => screen.getByRole('alert'));
      });

      it('renders content correctly', function () {
        expect(screen.getByRole('alert').textContent).to.be.equal(
          'An error occurred while loading navigation: Test error message'
        );
        expect(screen.queryByTestId('test-Instance.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Database.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Collection.Workspace')).to.not.exist;
      });

      it('renders the sidebar', function () {
        expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
      });

      it('renders the find', function () {
        expect(screen.getByTestId('test-Find')).to.be.visible;
      });

      it('renders the global modal role', function () {
        expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
      });

      it('renders the shell plugin', function () {
        expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
      });
    });

    describe('UI status is complete', function () {
      beforeEach(async function () {
        const instance = createInstance();
        await renderHome(createDataService(), instance);
        instance.set({ status: 'ready', refreshingStatus: 'ready' });
        await waitFor(() => screen.getByTestId('test-Instance.Workspace'));
      });

      describe('namespace is unset', function () {
        it('renders content correctly', function () {
          expect(screen.getByTestId('test-Instance.Workspace')).to.be.visible;
        });
        it('renders the sidebar', function () {
          expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
        });
        it('renders the find', function () {
          expect(screen.getByTestId('test-Find')).to.be.visible;
        });
        it('renders the shell plugin', function () {
          expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
        });
        it('renders the global modal role', function () {
          expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
        });
      });

      describe('on `select-namespace` only DB', function () {
        beforeEach(function () {
          testAppRegistry.emit('select-namespace', { namespace: 'db' });
        });

        it('renders content correctly', function () {
          expect(screen.getByTestId('test-Database.Workspace')).to.be.visible;
        });
        it('renders the sidebar', function () {
          expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
        });
        it('renders the find', function () {
          expect(screen.getByTestId('test-Find')).to.be.visible;
        });
        it('renders the shell plugin', function () {
          expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
        });
        it('renders the global modal role', function () {
          expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
        });
        it('updates the document title', async function () {
          await waitFor(() =>
            expect(document.title).to.equal('home-testing - mongodb.net/db')
          );
        });
      });

      describe('on `select-database`', function () {
        beforeEach(function () {
          testAppRegistry.emit('select-database', 'db');
        });

        it('renders content correctly', function () {
          expect(screen.getByTestId('test-Database.Workspace')).to.be.visible;
        });
        it('renders the sidebar', function () {
          expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
        });
        it('renders the find', function () {
          expect(screen.getByTestId('test-Find')).to.be.visible;
        });
        it('renders the shell plugin', function () {
          expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
        });
        it('renders the global modal role', function () {
          expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
        });
        it('updates the document title', async function () {
          await waitFor(() =>
            expect(document.title).to.equal('home-testing - mongodb.net/db')
          );
        });
      });

      describe('on `select-namespace` with db and coll', function () {
        beforeEach(function () {
          testAppRegistry.emit('select-namespace', { namespace: 'db.col' });
        });

        it('renders content correctly', function () {
          expect(screen.getByTestId('test-Collection.Workspace')).to.be.visible;
        });
        it('renders the sidebar', function () {
          expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
        });
        it('renders the find', function () {
          expect(screen.getByTestId('test-Find')).to.be.visible;
        });
        it('renders the global modal role', function () {
          expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
        });
        it('renders the shell plugin', function () {
          expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
        });
        it('updates the document title', async function () {
          await waitFor(() =>
            expect(document.title).to.equal('home-testing - mongodb.net/db.col')
          );
        });
      });

      describe('on `data-service-disconnected`', function () {
        beforeEach(function () {
          testAppRegistry.emit('data-service-disconnected');
        });

        it('renders the connect screen', function () {
          expect(screen.getByTestId('test-Application.Connect')).to.be.visible;
        });

        it('does not render the sidebar', function () {
          expect(screen.queryByTestId('test-Sidebar.Component')).to.not.exist;
        });
      });
    });
  });

  describe('when rendered', function () {
    beforeEach(function () {
      render(
        <AppRegistryContext.Provider value={testAppRegistry}>
          <Home appName="home-testing" />
        </AppRegistryContext.Provider>
      );
    });

    it('adds all the listeners', function () {
      const events = [
        'instance-created',
        'data-service-connected',
        'data-service-disconnected',
        'select-database',
        'select-namespace',
        'select-instance',
        'open-namespace-in-new-tab',
        'all-collection-tabs-closed',
      ];

      events.forEach((name) => {
        expect(testAppRegistry.listeners(name)).to.have.lengthOf(1);
      });
    });
  });

  describe('on dismount', function () {
    beforeEach(function () {
      const { unmount } = render(
        <AppRegistryContext.Provider value={testAppRegistry}>
          <Home appName="home-testing" />
        </AppRegistryContext.Provider>
      );
      unmount();
    });

    it('clears up all the listeners', function () {
      const events = [
        'instance-created',
        'data-service-connected',
        'data-service-disconnected',
        'select-database',
        'select-namespace',
        'select-instance',
        'open-namespace-in-new-tab',
        'all-collection-tabs-closed',
      ];

      events.forEach((name) => {
        expect(testAppRegistry.listeners(name)).to.have.lengthOf(0);
      });
    });
  });
});
