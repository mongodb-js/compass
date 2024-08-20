/* eslint-disable @typescript-eslint/no-empty-function */
import React from 'react';
import {
  render,
  screen,
  cleanup,
  within,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import Sinon from 'sinon';
import { ConnectionsNavigationTree } from './connections-navigation-tree';
import type { ConnectedConnection } from './tree-data';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';

const connections: ConnectedConnection[] = [
  {
    connectionInfo: { id: 'connectionId' } as any,
    connectionStatus: ConnectionStatus.Connected,
    databases: [
      {
        _id: 'foo',
        name: 'foo',
        collectionsStatus: 'initial',
        collectionsLength: 5,
        collections: [],
      },
      {
        _id: 'bar',
        name: 'bar',
        collectionsStatus: 'ready',
        collectionsLength: 3,
        collections: [
          { _id: 'bar.meow', name: 'meow', type: 'collection' },
          { _id: 'bar.woof', name: 'woof', type: 'timeseries' },
          { _id: 'bar.bwok', name: 'bwok', type: 'view' },
        ],
      },
    ],
    databasesLength: 2,
    databasesStatus: 'ready',
    isDataLake: false,
    isReady: true,
    isWritable: true,
    name: 'test',
    isPerformanceTabSupported: false,
  },
];

const TEST_VIRTUAL_PROPS = {
  __TEST_REACT_AUTOSIZER_DEFAULT_WIDTH: 1024,
  __TEST_REACT_AUTOSIZER_DEFAULT_HEIGHT: 768,
  __TEST_REACT_WINDOW_OVERSCAN: Infinity,
};

const activeWorkspace = {
  connectionId: 'connectionId',
  namespace: 'bar.meow',
  type: 'Collection',
};

const dummyPreferences = {
  getPreferences() {
    return {
      enableNewMultipleConnectionSystem: false,
    };
  },
  onPreferenceValueChanged() {},
} as unknown as PreferencesAccess;

function renderComponent(
  props: Partial<React.ComponentProps<typeof ConnectionsNavigationTree>> = {},
  preferences: PreferencesAccess = dummyPreferences
) {
  cleanup();
  return render(
    <PreferencesProvider value={preferences}>
      <ConnectionsNavigationTree
        connections={connections}
        expanded={{}}
        activeWorkspace={null}
        onItemAction={() => {}}
        onItemExpand={() => {}}
        {...TEST_VIRTUAL_PROPS}
        {...props}
      />
    </PreferencesProvider>
  );
}

// TODO: a bunch of these don't work
describe.skip('ConnectionsNavigationTree -- Single connection usage', function () {
  let preferences: PreferencesAccess;
  afterEach(cleanup);

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    renderComponent({});
  });

  context('when the rename collection feature flag is enabled', () => {
    beforeEach(async function () {
      await preferences.savePreferences({
        enableRenameCollectionModal: true,
        enableNewMultipleConnectionSystem: false,
      });

      renderComponent(
        {
          expanded: { connectionId: { bar: true } },
          activeWorkspace: activeWorkspace as WorkspaceTab,
        },
        preferences
      );
    });

    it('shows the Rename Collection action', function () {
      const collection = screen.getByTestId('connectionId.bar.meow');
      const showActionsButton = within(collection).getByTitle('Show actions');

      expect(within(collection).getByTitle('Show actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Rename collection')).to.exist;
    });

    it('should activate callback with `rename-collection` when corresponding action is clicked', function () {
      const spy = Sinon.spy();

      renderComponent(
        {
          expanded: { connectionId: { bar: true } },
          activeWorkspace: activeWorkspace as WorkspaceTab,
          onItemAction: spy,
        },
        preferences
      );

      const collection = screen.getByTestId('connectionId.bar.meow');

      userEvent.click(within(collection).getByTitle('Show actions'));
      userEvent.click(screen.getByText('Rename collection'));

      expect(spy).to.be.calledOnce;
      const [[item, action]] = spy.args;
      expect(item.type).to.equal('collection');
      expect(item.connectionId).to.equal('connectionId');
      expect(item.namespace).to.equal('bar.meow');
      expect(action).to.equal('rename-collection');
    });
  });

  it('should render databases', function () {
    expect(screen.getByText('foo')).to.exist;
    expect(screen.getByText('bar')).to.exist;
  });

  it('should render collections when database is expanded', function () {
    renderComponent({
      expanded: { connectionId: { bar: true } },
    });

    expect(screen.getByText('meow')).to.exist;
    expect(screen.getByText('woof')).to.exist;
    expect(screen.getByText('bwok')).to.exist;
  });

  it('should render collection placeholders when database is expanded but collections are not ready', function () {
    renderComponent({
      expanded: { connectionId: { foo: true } },
    });

    expect(screen.getAllByTestId('placeholder')).to.have.lengthOf(5);
  });

  it('should make current active namespace tabbable', async function () {
    renderComponent({
      activeWorkspace: {
        ...activeWorkspace,
        namespace: 'bar',
        type: 'Collections',
      } as WorkspaceTab,
    });

    userEvent.tab();

    await waitFor(() => {
      // Virtual list will be the one to grab the focus first, but will
      // immediately forward it to the element and mocking raf here breaks
      // virtual list implementatin, waitFor is to accomodate for that
      expect(document.querySelector('[data-id="connectionId.bar"]')).to.eq(
        document.activeElement
      );
      return true;
    });
  });

  describe('when connection is writable', function () {
    it('should show all database actions on hover', function () {
      userEvent.hover(screen.getByText('foo'));

      const database = screen.getByTestId('connectionId.foo');

      expect(within(database).getByTitle('Create collection')).to.exist;
      expect(within(database).getByTitle('Drop database')).to.exist;
    });

    it('should show all database actions for active namespace', function () {
      renderComponent({
        activeWorkspace: {
          ...activeWorkspace,
          namespace: 'bar',
          type: 'Collections',
        } as WorkspaceTab,
      });

      const database = screen.getByTestId('connectionId.bar');

      expect(within(database).getByTitle('Create collection')).to.exist;
      expect(within(database).getByTitle('Drop database')).to.exist;
    });

    it('should show all collection actions', function () {
      renderComponent({
        expanded: { connectionId: { bar: true } },
        activeWorkspace: activeWorkspace as WorkspaceTab,
      });

      const collection = screen.getByTestId('connectionId.bar.meow');
      const showActionsButton = within(collection).getByTitle('Show actions');

      expect(within(collection).getByTitle('Show actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Open in new tab')).to.exist;
      expect(() => screen.getByText('Rename collection')).to.throw;
      expect(screen.getByText('Drop collection')).to.exist;
    });

    it('should show all view actions', function () {
      renderComponent({
        expanded: { connectionId: { bar: true } },
        activeWorkspace: {
          ...activeWorkspace,
          namespace: 'bar.bwok',
        } as WorkspaceTab,
      });

      const collection = screen.getByTestId('connectionId.bar.bwok');
      const showActionsButton = within(collection).getByTitle('Show actions');

      expect(within(collection).getByTitle('Show actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Open in new tab')).to.exist;
      expect(screen.getByText('Drop view')).to.exist;
      expect(screen.getByText('Duplicate view')).to.exist;
      expect(screen.getByText('Modify view')).to.exist;

      // views cannot be renamed
      expect(() => screen.getByText('Rename collection')).to.throw;
    });
  });

  [
    {
      name: 'when connection is not writable',
      // eslint-disable-next-line @typescript-eslint/require-await
      async renderReadonlyComponent(
        props: Partial<
          React.ComponentProps<typeof ConnectionsNavigationTree>
        > = {}
      ) {
        const readonlyConnections: ConnectedConnection[] = [
          {
            ...connections[0],
            ...(props.connections as ConnectedConnection[])?.[0],
            isWritable: false,
          },
        ];
        renderComponent({
          ...props,
          connections: readonlyConnections,
        });
      },
    },
    {
      name: 'when connection is datalake',
      // eslint-disable-next-line @typescript-eslint/require-await
      async renderReadonlyComponent(
        props: Partial<
          React.ComponentProps<typeof ConnectionsNavigationTree>
        > = {}
      ) {
        const readonlyConnections: ConnectedConnection[] = [
          {
            ...connections[0],
            ...(props.connections as ConnectedConnection[])?.[0],
            isDataLake: true,
          },
        ];
        renderComponent({
          ...props,
          connections: readonlyConnections,
        });
      },
    },
    {
      name: 'when preferences is readonly',
      async renderReadonlyComponent(
        props: Partial<
          React.ComponentProps<typeof ConnectionsNavigationTree>
        > = {}
      ) {
        await preferences.savePreferences({
          readOnly: true,
        });
        const readonlyConnections: ConnectedConnection[] = [
          {
            ...connections[0],
            ...(props.connections as ConnectedConnection[])?.[0],
          },
        ];
        renderComponent(
          {
            ...props,
            connections: readonlyConnections,
          },
          preferences
        );
      },
    },
  ].forEach(function ({ name, renderReadonlyComponent }) {
    describe(name, function () {
      it('should not show database actions', async function () {
        await renderReadonlyComponent({
          activeWorkspace: {
            ...activeWorkspace,
            namespace: 'bar',
            type: 'Collections',
          } as WorkspaceTab,
        });

        const database = screen.getByTestId('connectionId.bar');

        expect(() => within(database).getByTitle('Create collection')).to.throw;
        expect(() => within(database).getByTitle('Drop database')).to.throw;
      });

      it('should show only one collection action', async function () {
        await renderReadonlyComponent({
          expanded: { connectionId: { bar: true } },
          activeWorkspace: {
            ...activeWorkspace,
            namespace: 'bar.bwok',
          } as WorkspaceTab,
        });

        const collection = screen.getByTestId('connectionId.bar.bwok');

        await waitFor(() => {
          expect(within(collection).getByTitle('Open in new tab')).to.exist;
        });
      });
    });
  });

  describe('onItemAction', function () {
    it('should activate callback with `select-database` when database is clicked', function () {
      const spy = Sinon.spy();
      renderComponent({
        onItemAction: spy,
      });

      userEvent.click(screen.getByText('foo'));

      expect(spy).to.be.calledOnce;
      const [[item, action]] = spy.args;
      expect(item.type).to.equal('database');
      expect(item.connectionId).to.equal('connectionId');
      expect(item.dbName).to.equal('foo');
      expect(action).to.equal('select-database');
    });

    it('should activate callback with `select-collection` when collection is clicked', function () {
      const spy = Sinon.spy();
      renderComponent({
        onItemAction: spy,
        expanded: { connectionId: { bar: true } },
      });

      userEvent.click(screen.getByText('meow'));

      expect(spy).to.be.calledOnce;
      const [[item, action]] = spy.args;
      expect(item.type).to.equal('collection');
      expect(item.connectionId).to.equal('connectionId');
      expect(item.namespace).to.equal('bar.meow');
      expect(action).to.equal('select-collection');
    });

    describe('database actions', function () {
      it('should activate callback with `drop-database` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        renderComponent({
          onItemAction: spy,
          activeWorkspace: {
            ...activeWorkspace,
            namespace: 'foo',
            type: 'Collections',
          } as WorkspaceTab,
        });

        userEvent.click(screen.getByTitle('Drop database'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('database');
        expect(item.connectionId).to.equal('connectionId');
        expect(item.dbName).to.equal('foo');
        expect(action).to.equal('drop-database');
      });

      it('should activate callback with `create-collection` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        renderComponent({
          onItemAction: spy,
          activeWorkspace: {
            ...activeWorkspace,
            namespace: 'foo',
            type: 'Collections',
          } as WorkspaceTab,
        });

        userEvent.click(screen.getByTitle('Create collection'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('database');
        expect(item.connectionId).to.equal('connectionId');
        expect(item.dbName).to.equal('foo');
        expect(action).to.equal('create-collection');
      });
    });

    describe('collection actions', function () {
      it('should activate callback with `open-in-new-tab` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        renderComponent({
          onItemAction: spy,
          expanded: { connectionId: { bar: true } },
          activeWorkspace: activeWorkspace as WorkspaceTab,
        });

        const collection = screen.getByTestId('connectionId.bar.meow');

        userEvent.click(within(collection).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Open in new tab'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('collection');
        expect(item.connectionId).to.equal('connectionId');
        expect(item.namespace).to.equal('bar.meow');
        expect(action).to.equal('open-in-new-tab');
      });

      it('should activate callback with `drop-collection` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        renderComponent({
          onItemAction: spy,
          expanded: { connectionId: { bar: true } },
          activeWorkspace: activeWorkspace as WorkspaceTab,
        });

        const collection = screen.getByTestId('connectionId.bar.meow');

        userEvent.click(within(collection).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Drop collection'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('collection');
        expect(item.connectionId).to.equal('connectionId');
        expect(item.namespace).to.equal('bar.meow');
        expect(action).to.equal('drop-collection');
      });
    });

    describe('view actions', function () {
      it('should activate callback with `duplicate-view` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        renderComponent({
          expanded: { connectionId: { bar: true } },
          activeWorkspace: {
            ...activeWorkspace,
            namespace: 'bar.bwok',
          } as WorkspaceTab,
          onItemAction: spy,
        });

        const view = screen.getByTestId('connectionId.bar.bwok');

        userEvent.click(within(view).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Duplicate view'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('view');
        expect(item.connectionId).to.equal('connectionId');
        expect(item.namespace).to.equal('bar.bwok');
        expect(action).to.equal('duplicate-view');
      });

      it('should activate callback with `modify-view` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        renderComponent({
          expanded: { connectionId: { bar: true } },
          activeWorkspace: {
            ...activeWorkspace,
            namespace: 'bar.bwok',
          } as WorkspaceTab,
          onItemAction: spy,
        });

        const view = screen.getByTestId('connectionId.bar.bwok');

        userEvent.click(within(view).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Modify view'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('view');
        expect(item.connectionId).to.equal('connectionId');
        expect(item.namespace).to.equal('bar.bwok');
        expect(action).to.equal('modify-view');
      });
    });
  });
});
