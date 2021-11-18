/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable react/prop-types */
import React from 'react';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { DatabasesNavigationTree } from './databases-navigation-tree';
import Sinon from 'sinon';

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

describe('DatabasesNavigationTree', function () {
  afterEach(cleanup);

  it('should render databases', function () {
    render(
      <DatabasesNavigationTree
        databases={databases}
        onDatabaseExpand={() => {}}
        onNamespaceAction={() => {}}
      ></DatabasesNavigationTree>
    );

    expect(screen.getByText('foo')).to.exist;
    expect(screen.getByText('bar')).to.exist;
  });

  it('should render collections when database is expanded', function () {
    render(
      <DatabasesNavigationTree
        databases={databases}
        expanded={{ bar: true }}
        onDatabaseExpand={() => {}}
        onNamespaceAction={() => {}}
      ></DatabasesNavigationTree>
    );

    expect(screen.getByText('meow')).to.exist;
    expect(screen.getByText('woof')).to.exist;
    expect(screen.getByText('bwok')).to.exist;
  });

  it('should render collection placeholders when database is expanded but collections are not ready', function () {
    render(
      <DatabasesNavigationTree
        databases={databases}
        expanded={{ foo: true }}
        onDatabaseExpand={() => {}}
        onNamespaceAction={() => {}}
      ></DatabasesNavigationTree>
    );

    expect(screen.getByTestId('placeholder')).to.exist;
  });

  it('should make current active namespace tabbable', function () {
    render(
      <DatabasesNavigationTree
        databases={databases}
        activeNamespace="bar"
        onDatabaseExpand={() => {}}
        onNamespaceAction={() => {}}
      ></DatabasesNavigationTree>
    );

    userEvent.tab();

    expect(document.querySelector('[data-id="bar"]')).to.eq(
      document.activeElement
    );
  });

  describe('when isReadOnly is false or undefined', function () {
    it('should show all database actions on hover', function () {
      render(
        <DatabasesNavigationTree
          databases={databases}
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
        ></DatabasesNavigationTree>
      );

      userEvent.hover(screen.getByText('foo'));

      const database = screen.getByTestId('database-foo');

      expect(within(database).getByTitle('Create collection')).to.exist;
      expect(within(database).getByTitle('Drop database')).to.exist;
    });

    it('should show all database actions for active namespace', function () {
      render(
        <DatabasesNavigationTree
          databases={databases}
          activeNamespace="bar"
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
        ></DatabasesNavigationTree>
      );

      const database = screen.getByTestId('database-bar');

      expect(within(database).getByTitle('Create collection')).to.exist;
      expect(within(database).getByTitle('Drop database')).to.exist;
    });

    it('should show all collection actions', function () {
      render(
        <DatabasesNavigationTree
          databases={databases}
          expanded={{ bar: true }}
          activeNamespace="bar.meow"
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
        ></DatabasesNavigationTree>
      );

      const collection = screen.getByTestId('collection-bar.meow');
      const showActionsButton = within(collection).getByTitle(
        'Show collection actions'
      );

      expect(within(collection).getByTitle('Show collection actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Open in New Tab')).to.exist;
      expect(screen.getByText('Drop Collection')).to.exist;
    });

    it('should show all view actions', function () {
      render(
        <DatabasesNavigationTree
          databases={databases}
          expanded={{ bar: true }}
          activeNamespace="bar.bwok"
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
        ></DatabasesNavigationTree>
      );

      const collection = screen.getByTestId('collection-bar.bwok');
      const showActionsButton = within(collection).getByTitle(
        'Show collection actions'
      );

      expect(within(collection).getByTitle('Show collection actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Open in New Tab')).to.exist;
      expect(screen.getByText('Drop View')).to.exist;
      expect(screen.getByText('Duplicate View')).to.exist;
      expect(screen.getByText('Modify View')).to.exist;
    });
  });

  describe('when isReadOnly is true', function () {
    it('should not show database actions', function () {
      render(
        <DatabasesNavigationTree
          databases={databases}
          activeNamespace="bar"
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
          isReadOnly
        ></DatabasesNavigationTree>
      );

      const database = screen.getByTestId('database-bar');

      expect(() => within(database).getByTitle('Create collection')).to.throw;
      expect(() => within(database).getByTitle('Drop database')).to.throw;
    });

    it('should show only one collection action', function () {
      render(
        <DatabasesNavigationTree
          databases={databases}
          expanded={{ bar: true }}
          activeNamespace="bar.bwok"
          onDatabaseExpand={() => {}}
          onNamespaceAction={() => {}}
          isReadOnly
        ></DatabasesNavigationTree>
      );

      const collection = screen.getByTestId('collection-bar.bwok');

      expect(within(collection).getByTitle('Open in New Tab')).to.exist;
    });
  });

  describe('onNamespaceAction', function () {
    it('should activate callback with `select-database` when database is clicked', function () {
      const spy = Sinon.spy();
      render(
        <DatabasesNavigationTree
          databases={databases}
          onNamespaceAction={spy}
          onDatabaseExpand={() => {}}
        ></DatabasesNavigationTree>
      );

      userEvent.click(screen.getByText('foo'));

      expect(spy).to.be.calledOnceWithExactly('foo', 'select-database');
    });

    it('should activate callback with `select-collection` when collection is clicked', function () {
      const spy = Sinon.spy();
      render(
        <DatabasesNavigationTree
          databases={databases}
          expanded={{ bar: true }}
          onNamespaceAction={spy}
          onDatabaseExpand={() => {}}
        ></DatabasesNavigationTree>
      );

      userEvent.click(screen.getByText('meow'));

      expect(spy).to.be.calledOnceWithExactly('bar.meow', 'select-collection');
    });

    describe('database actions', function () {
      it('should activate callback with `drop-database` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        render(
          <DatabasesNavigationTree
            databases={databases}
            activeNamespace="foo"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
          ></DatabasesNavigationTree>
        );

        userEvent.click(screen.getByTitle('Drop database'));

        expect(spy).to.be.calledOnceWithExactly('foo', 'drop-database');
      });

      it('should activate callback with `create-collection` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        render(
          <DatabasesNavigationTree
            databases={databases}
            activeNamespace="foo"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
          ></DatabasesNavigationTree>
        );

        userEvent.click(screen.getByTitle('Create collection'));

        expect(spy).to.be.calledOnceWithExactly('foo', 'create-collection');
      });
    });

    describe('collection actions', function () {
      it('should activate callback with `open-in-new-tab` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        render(
          <DatabasesNavigationTree
            databases={databases}
            expanded={{ bar: true }}
            activeNamespace="bar.meow"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
          ></DatabasesNavigationTree>
        );

        const collection = screen.getByTestId('collection-bar.meow');

        userEvent.click(
          within(collection).getByTitle('Show collection actions')
        );
        userEvent.click(screen.getByText('Open in New Tab'));

        expect(spy).to.be.calledOnceWithExactly('bar.meow', 'open-in-new-tab');
      });

      it('should activate callback with `drop-collection` when corresponding action is clicked', function () {
        const spy = Sinon.spy();
        render(
          <DatabasesNavigationTree
            databases={databases}
            expanded={{ bar: true }}
            activeNamespace="bar.meow"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
          ></DatabasesNavigationTree>
        );

        const collection = screen.getByTestId('collection-bar.meow');

        userEvent.click(
          within(collection).getByTitle('Show collection actions')
        );
        userEvent.click(screen.getByText('Drop Collection'));

        expect(spy).to.be.calledOnceWithExactly('bar.meow', 'drop-collection');
      });
    });

    describe('view actions', function () {
      it('should activate callback with `duplicate-view` when corresponding action is clicked', function () {
        const spy = Sinon.spy();

        render(
          <DatabasesNavigationTree
            databases={databases}
            expanded={{ bar: true }}
            activeNamespace="bar.bwok"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
          ></DatabasesNavigationTree>
        );

        const view = screen.getByTestId('collection-bar.bwok');

        userEvent.click(within(view).getByTitle('Show collection actions'));
        userEvent.click(screen.getByText('Duplicate View'));

        expect(spy).to.be.calledOnceWithExactly('bar.bwok', 'duplicate-view');
      });

      it('should activate callback with `modify-view` when corresponding action is clicked', function () {
        const spy = Sinon.spy();

        render(
          <DatabasesNavigationTree
            databases={databases}
            expanded={{ bar: true }}
            activeNamespace="bar.bwok"
            onNamespaceAction={spy}
            onDatabaseExpand={() => {}}
          ></DatabasesNavigationTree>
        );

        const view = screen.getByTestId('collection-bar.bwok');

        userEvent.click(within(view).getByTitle('Show collection actions'));
        userEvent.click(screen.getByText('Modify View'));

        expect(spy).to.be.calledOnceWithExactly('bar.bwok', 'modify-view');
      });
    });
  });
});
