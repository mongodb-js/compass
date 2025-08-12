import React from 'react';
import { expect } from 'chai';
import WorkspacesPlugin, { WorkspacesProvider } from './index';
import Sinon from 'sinon';
import type { AnyWorkspacePlugin } from './components/workspaces-provider';
import { useOpenWorkspace } from './provider';
import {
  renderWithConnections,
  cleanup,
  screen,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { TestMongoDBInstanceManager } from '@mongodb-js/compass-app-stores/provider';
import { WorkspaceTab } from '@mongodb-js/compass-components';

function mockWorkspace(name: string) {
  return {
    name,
    provider: function Component({
      children,
      props,
    }: {
      children?: React.ReactNode;
      props?: any;
    }) {
      return <div {...props}>{children}</div>;
    },
    content: function Component() {
      return <>{name}</>;
    },
    header: function Component(props: any) {
      return (
        <WorkspaceTab
          {...props}
          name={props.namespace ?? name}
          title={props.namespace ?? name}
          iconGlyph="Home"
          type={name}
        />
      );
    },
  } as unknown as AnyWorkspacePlugin;
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
        connections: [TEST_CONNECTION_INFO],
        connectFn() {
          return {
            listDatabases() {
              return Promise.resolve([
                // Mock the databases and collections so we don't trigger the onNamespaceNotFound
                // fallback handler which redirects collections to the databases view.
                {
                  _id: 'db',
                  name: 'db',
                  inferred_from_privileges: false,
                  collection_count: 0,
                  document_count: 0,
                  index_count: 0,
                  storage_size: 0,
                  data_size: 0,
                  index_size: 0,
                },
              ]);
            },
            listCollections() {
              return Promise.resolve(
                Array.from({
                  length: 3,
                }).map((_, index) => ({
                  _id: `db.coll${index}`,
                  name: `coll${index}`,
                  database: 'db',
                  type: 'collection',
                })) as any
              );
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

  const tabs = [
    ['My Queries', () => openFns.openMyQueriesWorkspace()],
    ['Databases', () => openFns.openDatabasesWorkspace('1')],
    ['Performance', () => openFns.openPerformanceWorkspace('1')],
    ['db', () => openFns.openCollectionsWorkspace('1', 'db')],
    ['db.coll0', () => openFns.openCollectionWorkspace('1', 'db.coll0')],
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

    openFns.openCollectionWorkspace('1', 'db.coll0', { newTab: true });
    openFns.openCollectionWorkspace('1', 'db.coll1', { newTab: true });
    openFns.openCollectionWorkspace('1', 'db.coll2', { newTab: true });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'db.coll2' })).to.have.attribute(
        'aria-selected',
        'true'
      );
    });

    userEvent.click(screen.getByRole('tab', { name: 'db.coll0' }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'db.coll2' })).to.have.attribute(
        'aria-selected',
        'false'
      );
      expect(screen.getByRole('tab', { name: 'db.coll0' })).to.have.attribute(
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
