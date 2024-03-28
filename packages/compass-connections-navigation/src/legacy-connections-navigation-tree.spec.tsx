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
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

const databases = [
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
];

const TEST_VIRTUAL_PROPS = {
  __TEST_REACT_AUTOSIZER_DEFAULT_WIDTH: 1024,
  __TEST_REACT_AUTOSIZER_DEFAULT_HEIGHT: 768,
  __TEST_REACT_WINDOW_OVERSCAN: Infinity,
};

describe('ConnectionsNavigationTree -- Legacy usage', function () {
  afterEach(cleanup);

  context('when the rename collection feature flag is enabled', () => {
    let preferences: PreferencesAccess;
    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({ enableRenameCollectionModal: true });
    });

    it('shows the Rename Collection action', function () {
      render(
        <PreferencesProvider value={preferences}>
          <ConnectionsNavigationTree
            databasesLegacy={databases}
            expandedLegacy={{ bar: true }}
            activeNamespace="bar.meow"
            onDatabaseExpand={() => {}}
            onNamespaceAction={() => {}}
            {...TEST_VIRTUAL_PROPS}
          />
        </PreferencesProvider>
      );

      const collection = screen.getByTestId('sidebar-collection-bar.meow');
      const showActionsButton = within(collection).getByTitle('Show actions');

      expect(within(collection).getByTitle('Show actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Rename collection')).to.exist;
    });

    it('should activate callback with `rename-collection` when corresponding action is clicked', function () {
      const spy = Sinon.spy();
      render(
        <PreferencesProvider value={preferences}>
          <ConnectionsNavigationTree
            databasesLegacy={databases}
            expandedLegacy={{ bar: true }}
            activeNamespace="bar.meow"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
            {...TEST_VIRTUAL_PROPS}
          />
        </PreferencesProvider>
      );

      const collection = screen.getByTestId('sidebar-collection-bar.meow');

      userEvent.click(within(collection).getByTitle('Show actions'));
      userEvent.click(screen.getByText('Rename collection'));

      expect(spy).to.be.calledOnceWithExactly('bar.meow', 'rename-collection');
    });
  });

  it('should render databases', function () {
    render(
      <ConnectionsNavigationTree
        databasesLegacy={databases}
        onDatabaseExpand={() => {}}
        onNamespaceAction={() => {}}
        {...TEST_VIRTUAL_PROPS}
      ></ConnectionsNavigationTree>
    );

    expect(screen.getByText('foo')).to.exist;
    expect(screen.getByText('bar')).to.exist;
  });

  it('should render collections when database is expanded', function () {
    render(
      <ConnectionsNavigationTree
        databasesLegacy={databases}
        expandedLegacy={{ bar: true }}
        onDatabaseExpand={() => {}}
        onNamespaceAction={() => {}}
        {...TEST_VIRTUAL_PROPS}
      ></ConnectionsNavigationTree>
    );

    expect(screen.getByText('meow')).to.exist;
    expect(screen.getByText('woof')).to.exist;
    expect(screen.getByText('bwok')).to.exist;
  });

  it('should render collection placeholders when database is expanded but collections are not ready', function () {
    render(
      <ConnectionsNavigationTree
        databasesLegacy={databases}
        expandedLegacy={{ foo: true }}
        onDatabaseExpand={() => {}}
        onNamespaceAction={() => {}}
        {...TEST_VIRTUAL_PROPS}
      ></ConnectionsNavigationTree>
    );

    expect(screen.getAllByTestId('placeholder')).to.have.lengthOf(5);
  });

  it('should make current active namespace tabbable', async function () {
    render(
      <ConnectionsNavigationTree
        databasesLegacy={databases}
        activeNamespace="bar"
        onDatabaseExpand={() => {}}
        onNamespaceAction={() => {}}
        {...TEST_VIRTUAL_PROPS}
      ></ConnectionsNavigationTree>
    );

    userEvent.tab();

    await waitFor(() => {
      // Virtual list will be the one to grab the focus first, but will
      // immediately forward it to the element and mocking raf here breaks
      // virtual list implementatin, waitFor is to accomodate for that
      expect(document.querySelector('[data-id="bar"]')).to.eq(
        document.activeElement
      );
      return true;
    });
  });

  describe('when isReadOnly is false or undefined', function () {
    it('should show all database actions on hover', function () {
      render(
        <ConnectionsNavigationTree
          databasesLegacy={databases}
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
          {...TEST_VIRTUAL_PROPS}
        ></ConnectionsNavigationTree>
      );

      userEvent.hover(screen.getByText('foo'));

      const database = screen.getByTestId('sidebar-database-foo');

      expect(within(database).getByTitle('Create collection')).to.exist;
      expect(within(database).getByTitle('Drop database')).to.exist;
    });

    it('should show all database actions for active namespace', function () {
      render(
        <ConnectionsNavigationTree
          databasesLegacy={databases}
          activeNamespace="bar"
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
          {...TEST_VIRTUAL_PROPS}
        ></ConnectionsNavigationTree>
      );

      const database = screen.getByTestId('sidebar-database-bar');

      expect(within(database).getByTitle('Create collection')).to.exist;
      expect(within(database).getByTitle('Drop database')).to.exist;
    });

    it('should show all collection actions', function () {
      render(
        <ConnectionsNavigationTree
          databasesLegacy={databases}
          expandedLegacy={{ bar: true }}
          activeNamespace="bar.meow"
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
          {...TEST_VIRTUAL_PROPS}
        ></ConnectionsNavigationTree>
      );

      const collection = screen.getByTestId('sidebar-collection-bar.meow');
      const showActionsButton = within(collection).getByTitle('Show actions');

      expect(within(collection).getByTitle('Show actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Open in new tab')).to.exist;
      expect(() => screen.getByText('Rename collection')).to.throw;
      expect(screen.getByText('Drop collection')).to.exist;
    });

    it('should show all view actions', function () {
      render(
        <ConnectionsNavigationTree
          databasesLegacy={databases}
          expandedLegacy={{ bar: true }}
          activeNamespace="bar.bwok"
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
          {...TEST_VIRTUAL_PROPS}
        ></ConnectionsNavigationTree>
      );

      const collection = screen.getByTestId('sidebar-collection-bar.bwok');
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

  describe('when isReadOnly is true', function () {
    it('should not show database actions', function () {
      render(
        <ConnectionsNavigationTree
          databasesLegacy={databases}
          activeNamespace="bar"
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
          isReadOnly
          {...TEST_VIRTUAL_PROPS}
        ></ConnectionsNavigationTree>
      );

      const database = screen.getByTestId('sidebar-database-bar');

      expect(() => within(database).getByTitle('Create collection')).to.throw;
      expect(() => within(database).getByTitle('Drop database')).to.throw;
    });

    it('should show only one collection action', function () {
      render(
        <ConnectionsNavigationTree
          databasesLegacy={databases}
          expandedLegacy={{ bar: true }}
          activeNamespace="bar.bwok"
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
          isReadOnly
          {...TEST_VIRTUAL_PROPS}
        ></ConnectionsNavigationTree>
      );

      const collection = screen.getByTestId('sidebar-collection-bar.bwok');

      expect(within(collection).getByTitle('Open in new tab')).to.exist;
    });
  });

  describe('onNamespaceAction', function () {
    it('should activate callback with `select-database` when database is clicked', function () {
      const spy = Sinon.spy();
      render(
        <ConnectionsNavigationTree
          databasesLegacy={databases}
          onNamespaceAction={spy}
          onDatabaseExpand={() => {}}
          {...TEST_VIRTUAL_PROPS}
        ></ConnectionsNavigationTree>
      );

      userEvent.click(screen.getByText('foo'));

      expect(spy).to.be.calledOnceWithExactly('foo', 'select-database');
    });

    it('should activate callback with `select-collection` when collection is clicked', function () {
      const spy = Sinon.spy();
      render(
        <ConnectionsNavigationTree
          databasesLegacy={databases}
          expandedLegacy={{ bar: true }}
          onNamespaceAction={spy}
          onDatabaseExpand={() => {}}
          {...TEST_VIRTUAL_PROPS}
        ></ConnectionsNavigationTree>
      );

      userEvent.click(screen.getByText('meow'));

      expect(spy).to.be.calledOnceWithExactly('bar.meow', 'select-collection');
    });

    describe('database actions', function () {
      it('should activate callback with `drop-database` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        render(
          <ConnectionsNavigationTree
            databasesLegacy={databases}
            activeNamespace="foo"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
            {...TEST_VIRTUAL_PROPS}
          ></ConnectionsNavigationTree>
        );

        userEvent.click(screen.getByTitle('Drop database'));

        expect(spy).to.be.calledOnceWithExactly('foo', 'drop-database');
      });

      it('should activate callback with `create-collection` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        render(
          <ConnectionsNavigationTree
            databasesLegacy={databases}
            activeNamespace="foo"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
            {...TEST_VIRTUAL_PROPS}
          ></ConnectionsNavigationTree>
        );

        userEvent.click(screen.getByTitle('Create collection'));

        expect(spy).to.be.calledOnceWithExactly('foo', 'create-collection');
      });
    });

    describe('collection actions', function () {
      it('should activate callback with `open-in-new-tab` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        render(
          <ConnectionsNavigationTree
            databasesLegacy={databases}
            expandedLegacy={{ bar: true }}
            activeNamespace="bar.meow"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
            {...TEST_VIRTUAL_PROPS}
          ></ConnectionsNavigationTree>
        );

        const collection = screen.getByTestId('sidebar-collection-bar.meow');

        userEvent.click(within(collection).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Open in new tab'));

        expect(spy).to.be.calledOnceWithExactly('bar.meow', 'open-in-new-tab');
      });

      it('should activate callback with `drop-collection` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        render(
          <ConnectionsNavigationTree
            databasesLegacy={databases}
            expandedLegacy={{ bar: true }}
            activeNamespace="bar.meow"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
            {...TEST_VIRTUAL_PROPS}
          ></ConnectionsNavigationTree>
        );

        const collection = screen.getByTestId('sidebar-collection-bar.meow');

        userEvent.click(within(collection).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Drop collection'));

        expect(spy).to.be.calledOnceWithExactly('bar.meow', 'drop-collection');
      });
    });

    describe('view actions', function () {
      it('should activate callback with `duplicate-view` when corresponding action is clicked', function () {
        const spy = Sinon.spy();

        render(
          <ConnectionsNavigationTree
            databasesLegacy={databases}
            expandedLegacy={{ bar: true }}
            activeNamespace="bar.bwok"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
            {...TEST_VIRTUAL_PROPS}
          ></ConnectionsNavigationTree>
        );

        const view = screen.getByTestId('sidebar-collection-bar.bwok');

        userEvent.click(within(view).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Duplicate view'));

        expect(spy).to.be.calledOnceWithExactly('bar.bwok', 'duplicate-view');
      });

      it('should activate callback with `modify-view` when corresponding action is clicked', function () {
        const spy = Sinon.spy();

        render(
          <ConnectionsNavigationTree
            databasesLegacy={databases}
            expandedLegacy={{ bar: true }}
            activeNamespace="bar.bwok"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
            {...TEST_VIRTUAL_PROPS}
          ></ConnectionsNavigationTree>
        );

        const view = screen.getByTestId('sidebar-collection-bar.bwok');

        userEvent.click(within(view).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Modify view'));

        expect(spy).to.be.calledOnceWithExactly('bar.bwok', 'modify-view');
      });
    });
  });
});
