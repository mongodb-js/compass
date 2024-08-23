import React from 'react';
import { expect } from 'chai';
import WorkspacesPlugin, { WorkspacesProvider } from './index';
import Sinon from 'sinon';
import type { AnyWorkspaceComponent } from './components/workspaces-provider';
import { useOpenWorkspace } from './provider';
import {
  renderWithConnections,
  cleanup,
  screen,
  waitFor,
  userEvent,
} from '@mongodb-js/compass-connections/test';
import { TestMongoDBInstanceManager } from '@mongodb-js/compass-app-stores/provider';

function mockWorkspace(name: string) {
  return {
    name,
    component: function Component() {
      return <>{name}</>;
    },
  } as unknown as AnyWorkspaceComponent;
}

const TEST_CONNECTION_INFO = {
  id: '1',
  favorite: {
    name: 'Test Connection',
  },
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
};

describe('WorkspacesPlugin', function () {
  const sandbox = Sinon.createSandbox();
  const instancesManager = new TestMongoDBInstanceManager();
  const Plugin = WorkspacesPlugin.withMockServices(
    { instancesManager },
    { disableChildPluginRendering: true }
  );
  const onTabChangeSpy = sandbox.spy();
  let openFns: ReturnType<typeof useOpenWorkspace>;

  async function renderPlugin() {
    function OpenWorkspaceFnsGetter() {
      openFns = useOpenWorkspace();
      return null;
    }
    const result = renderWithConnections(
      <WorkspacesProvider
        value={[
          mockWorkspace('Welcome'),
          mockWorkspace('My Queries'),
          mockWorkspace('Databases'),
          mockWorkspace('Performance'),
          mockWorkspace('Collections'),
          mockWorkspace('Collection'),
        ]}
      >
        <Plugin
          onActiveWorkspaceTabChange={onTabChangeSpy}
          // Using modals renderer to get access to the real workspaces methods
          renderModals={() => {
            return <OpenWorkspaceFnsGetter></OpenWorkspaceFnsGetter>;
          }}
        ></Plugin>
      </WorkspacesProvider>,
      {
        preferences: {
          enableNewMultipleConnectionSystem: true,
        },
        connections: [TEST_CONNECTION_INFO],
        connectFn() {
          return {
            listDatabases() {
              return Promise.resolve([]);
            },
            listCollections() {
              return Promise.resolve([]);
            },
          };
        },
      }
    );
    await result.connectionsStore.actions.connect(TEST_CONNECTION_INFO);
  }

  afterEach(function () {
    (openFns as any) = null;
    sandbox.restore();
    sandbox.resetHistory();
    cleanup();
  });

  const connectionName = TEST_CONNECTION_INFO.favorite.name;
  const tabs = [
    ['My Queries', () => openFns.openMyQueriesWorkspace()],
    [connectionName, () => openFns.openDatabasesWorkspace('1')], // Databases
    [
      `Performance: ${connectionName}`,
      () => openFns.openPerformanceWorkspace('1'),
    ],
    ['db', () => openFns.openCollectionsWorkspace('1', 'db')],
    ['coll', () => openFns.openCollectionWorkspace('1', 'db.coll')],
  ] as const;

  for (const suite of tabs) {
    const [tabName, fn] = suite;
    it(`should open "${tabName}" tab when corresponding open method is called`, async function () {
      await renderPlugin();
      fn();
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: tabName })).to.exist;
      });
    });
  }

  it('should switch tabs when tab is clicked', async function () {
    await renderPlugin();

    expect(onTabChangeSpy).to.have.been.calledWith(null);

    openFns.openCollectionWorkspace('1', 'db.coll1', { newTab: true });
    openFns.openCollectionWorkspace('1', 'db.coll2', { newTab: true });
    openFns.openCollectionWorkspace('1', 'db.coll3', { newTab: true });

    expect(screen.getByRole('tab', { name: 'coll3' })).to.have.attribute(
      'aria-selected',
      'true'
    );

    userEvent.click(screen.getByRole('tab', { name: 'coll1' }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'coll3' })).to.have.attribute(
        'aria-selected',
        'false'
      );
      expect(screen.getByRole('tab', { name: 'coll1' })).to.have.attribute(
        'aria-selected',
        'true'
      );
    });

    expect(onTabChangeSpy).to.have.been.calledWithMatch({
      type: 'Collection',
      namespace: 'db.coll1',
    });
  });
});
