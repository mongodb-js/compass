import React from 'react';
import {
  screen,
  cleanup,
  fireEvent,
  userEvent,
  waitFor,
  renderWithConnections,
  createDefaultConnectionInfo,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  ApplicationMenuContextProvider,
  type ApplicationMenuProvider,
} from '@mongodb-js/compass-electron-menu';
import type { CompassAppMenu } from '@mongodb-js/compass-electron-menu';
import { TestMongoDBInstanceManager } from '@mongodb-js/compass-app-stores/provider';
import { CompassGoToPlugin } from '../index';

const initialUserAgent = navigator.userAgent;

const connectedConnection = {
  ...createDefaultConnectionInfo(),
  id: 'conn-1',
  favorite: { name: 'Production' },
};

const disconnectedConnection = {
  ...createDefaultConnectionInfo(),
  id: 'conn-2',
  favorite: { name: 'Staging Offline' },
};

describe('CompassGoTo', function () {
  let showApplicationMenu: sinon.SinonStub;
  let menuProvider: ApplicationMenuProvider;
  let workspaces: {
    openDatabasesWorkspace: sinon.SinonStub;
    openCollectionsWorkspace: sinon.SinonStub;
    openCollectionWorkspace: sinon.SinonStub;
  };
  let Plugin: typeof CompassGoToPlugin;

  before(function () {
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
      writable: true,
    });
  });

  after(function () {
    Object.defineProperty(navigator, 'userAgent', {
      value: initialUserAgent,
      writable: true,
    });
  });

  beforeEach(function () {
    showApplicationMenu = sinon.stub().returns(() => {});
    menuProvider = {
      showApplicationMenu,
      handleMenuRole: sinon.stub().returns(() => {}),
    };

    const instancesManager = new TestMongoDBInstanceManager({
      _id: '1',
      status: 'ready',
      databasesStatus: 'ready',
      databases: [
        {
          _id: 'users',
          name: 'users',
          collectionsStatus: 'ready',
          collections: [
            {
              _id: 'users.accounts',
              name: 'accounts',
              type: 'collection',
            },
            {
              _id: 'users.profiles',
              name: 'profiles',
              type: 'collection',
            },
          ],
        },
      ] as any,
    });

    const instance = instancesManager.getMongoDBInstanceForConnection();
    sinon.stub(instance, 'fetchDatabases').resolves();
    for (const database of instance.databases) {
      sinon.stub(database, 'fetchCollections').resolves();
    }

    sinon
      .stub(instancesManager, 'listMongoDBInstances')
      .returns(new Map([[connectedConnection.id, instance]]));

    workspaces = {
      openDatabasesWorkspace: sinon.stub(),
      openCollectionsWorkspace: sinon.stub(),
      openCollectionWorkspace: sinon.stub(),
    };

    Plugin = CompassGoToPlugin.withMockServices({
      instancesManager,
      workspaces: workspaces as any,
    });
  });

  afterEach(cleanup);

  function renderGoTo(
    preferences: { enableGoTo?: boolean } = {},
    connections = [connectedConnection, disconnectedConnection],
    connectFn?: () => any
  ) {
    return renderWithConnections(
      <ApplicationMenuContextProvider provider={menuProvider}>
        <Plugin />
      </ApplicationMenuContextProvider>,
      {
        preferences: {
          enableGoTo: true,
          ...preferences,
        },
        connections,
        connectFn:
          connectFn ??
          (() => {
            return {
              listDatabases() {
                return Promise.resolve([]);
              },
              listCollections() {
                return Promise.resolve([]);
              },
            };
          }),
      }
    );
  }

  async function openConnectedPalette(connectFn?: () => any) {
    const result = renderGoTo(
      {},
      [connectedConnection, disconnectedConnection],
      connectFn
    );
    await result.connectionsStore.actions.connect({
      ...connectedConnection,
    });
    fireEvent.keyDown(document, { key: 'p', metaKey: true });
    expect(screen.getByTestId('go-to-palette')).to.be.visible;
    return result;
  }

  function pressModP() {
    fireEvent.keyDown(document, { key: 'p', metaKey: true });
  }

  it('opens a top-centered palette with Search connections placeholder on mod+p', function () {
    renderGoTo();

    expect(screen.queryByTestId('go-to-palette')).to.equal(null);

    pressModP();

    expect(screen.getByTestId('go-to-palette')).to.be.visible;
    expect(screen.getByPlaceholderText('Search connections')).to.be.visible;
    expect(screen.getByTestId('go-to-results')).to.be.visible;
  });

  it('closes the palette on Escape', function () {
    renderGoTo();
    pressModP();
    expect(screen.getByTestId('go-to-palette')).to.be.visible;

    userEvent.keyboard('{Escape}');

    expect(screen.queryByTestId('go-to-palette')).to.equal(null);
  });

  it('closes the palette on click outside', function () {
    renderGoTo();
    pressModP();
    expect(screen.getByTestId('go-to-palette')).to.be.visible;

    userEvent.click(screen.getByTestId('go-to-backdrop'));

    expect(screen.queryByTestId('go-to-palette')).to.equal(null);
  });

  it('closes the palette when mod+p is pressed while open', function () {
    renderGoTo();
    pressModP();
    expect(screen.getByTestId('go-to-palette')).to.be.visible;

    pressModP();

    expect(screen.queryByTestId('go-to-palette')).to.equal(null);
  });

  it('registers File → Go to… with CmdOrCtrl+P when the flag is on', function () {
    renderGoTo();

    expect(showApplicationMenu.calledOnce).to.equal(true);
    const menu = showApplicationMenu.firstCall.args[0] as CompassAppMenu;
    expect(menu.label).to.equal('&File');
    expect(menu.submenu).to.have.length(1);
    expect(menu.submenu?.[0]).to.include({
      label: 'Go to…',
      accelerator: 'CmdOrCtrl+P',
    });
  });

  it('opens the palette from the File menu item', function () {
    renderGoTo();

    const menu = showApplicationMenu.firstCall.args[0] as CompassAppMenu;
    const click =
      menu.submenu?.[0] && 'click' in menu.submenu[0]
        ? menu.submenu[0].click
        : undefined;
    expect(click).to.be.a('function');
    click?.();

    expect(screen.getByTestId('go-to-palette')).to.be.visible;
  });

  it('does not open on mod+p when the flag is off', function () {
    renderGoTo({ enableGoTo: false });

    pressModP();

    expect(screen.queryByTestId('go-to-palette')).to.equal(null);
    expect(showApplicationMenu.called).to.equal(false);
  });

  it('loads connected inventory on open and shows ranked results while typing', async function () {
    await openConnectedPalette();

    expect(screen.queryAllByTestId('go-to-result')).to.have.length(0);

    userEvent.type(
      screen.getByPlaceholderText('Search connections'),
      'accounts'
    );

    await waitFor(() => {
      const results = screen.getAllByTestId('go-to-result');
      expect(results[0]).to.include.text('accounts');
      expect(results[0]).to.include.text('Production');
    });
  });

  it('highlights the first result and wraps with arrow keys', async function () {
    await openConnectedPalette();

    userEvent.type(screen.getByPlaceholderText('Search connections'), 'user');

    await waitFor(() => {
      expect(screen.getAllByTestId('go-to-result').length).to.be.greaterThan(1);
    });

    const results = screen.getAllByTestId('go-to-result');
    expect(results[0].getAttribute('aria-selected')).to.equal('true');

    userEvent.keyboard('{ArrowDown}');
    expect(results[1].getAttribute('aria-selected')).to.equal('true');

    userEvent.keyboard('{ArrowUp}');
    expect(results[0].getAttribute('aria-selected')).to.equal('true');

    userEvent.keyboard('{ArrowUp}');
    expect(results[results.length - 1].getAttribute('aria-selected')).to.equal(
      'true'
    );
  });

  it('opens the Collections workspace when activating a database result', async function () {
    await openConnectedPalette();

    userEvent.type(screen.getByPlaceholderText('Search connections'), 'users');

    await waitFor(() => {
      expect(
        screen
          .getAllByTestId('go-to-result')
          .some(
            (el) =>
              el.getAttribute('data-result-id') === 'database:conn-1:users'
          )
      ).to.equal(true);
    });

    const databaseResult = screen
      .getAllByTestId('go-to-result')
      .find(
        (el) => el.getAttribute('data-result-id') === 'database:conn-1:users'
      );
    userEvent.click(databaseResult!);

    await waitFor(() => {
      expect(workspaces.openCollectionsWorkspace.calledOnce).to.equal(true);
      expect(screen.queryByTestId('go-to-palette')).to.equal(null);
    });
    expect(workspaces.openCollectionsWorkspace.firstCall.args).to.deep.equal([
      'conn-1',
      'users',
    ]);
  });

  it('opens the Collection workspace on Enter for a collection result', async function () {
    await openConnectedPalette();

    userEvent.type(
      screen.getByPlaceholderText('Search connections'),
      'users.accounts'
    );

    await waitFor(() => {
      const first = screen.getAllByTestId('go-to-result')[0];
      expect(first.getAttribute('data-result-id')).to.equal(
        'collection:conn-1:users.accounts'
      );
    });

    userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(workspaces.openCollectionWorkspace.calledOnce).to.equal(true);
    });
    expect(workspaces.openCollectionWorkspace.firstCall.args).to.deep.equal([
      'conn-1',
      'users.accounts',
    ]);
  });

  it('shows disconnected hosts as connection rows only', async function () {
    await openConnectedPalette();

    userEvent.type(
      screen.getByPlaceholderText('Search connections'),
      'Staging Offline'
    );

    await waitFor(() => {
      const results = screen.getAllByTestId('go-to-result');
      expect(results).to.have.length(1);
      expect(results[0].getAttribute('data-result-id')).to.equal(
        'connection:conn-2'
      );
    });
  });

  it('connects then opens Databases when activating a disconnected connection', async function () {
    await openConnectedPalette();

    userEvent.type(
      screen.getByPlaceholderText('Search connections'),
      'Staging Offline'
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('go-to-result').getAttribute('data-result-id')
      ).to.equal('connection:conn-2');
    });

    userEvent.click(screen.getByTestId('go-to-result'));

    await waitFor(() => {
      expect(workspaces.openDatabasesWorkspace.calledOnce).to.equal(true);
      expect(screen.queryByTestId('go-to-palette')).to.equal(null);
    });
    expect(workspaces.openDatabasesWorkspace.firstCall.args).to.deep.equal([
      'conn-2',
    ]);
  });

  it('keeps the palette open with an inline error when connect fails', async function () {
    let allowConnect = true;
    await openConnectedPalette(() => {
      if (!allowConnect) {
        return Promise.reject(new Error('Authentication failed'));
      }
      return {
        listDatabases() {
          return Promise.resolve([]);
        },
        listCollections() {
          return Promise.resolve([]);
        },
      };
    });

    allowConnect = false;

    userEvent.type(
      screen.getByPlaceholderText('Search connections'),
      'Staging Offline'
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('go-to-result').getAttribute('data-result-id')
      ).to.equal('connection:conn-2');
    });

    expect(
      screen.getByTestId('go-to-result').getAttribute('aria-selected')
    ).to.equal('true');

    userEvent.click(screen.getByTestId('go-to-result'));

    await waitFor(() => {
      expect(screen.getByTestId('go-to-activation-error')).to.include.text(
        'Authentication failed'
      );
    });
    expect(screen.getByTestId('go-to-palette')).to.be.visible;
    expect(
      screen.getByTestId('go-to-result').getAttribute('aria-selected')
    ).to.equal('true');
    expect(workspaces.openDatabasesWorkspace.called).to.equal(false);
  });
});
