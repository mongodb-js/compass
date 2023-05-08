import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { DatabasesList, CollectionsList } from './index';
import Sinon from 'sinon';

function createDatabase(name) {
  return {
    _id: name,
    name: name,
    status: 'ready' as const,
    storage_size: 0,
    data_size: 0,
    index_count: 0,
    collectionsLength: 0,
  };
}

function createCollection(name) {
  return {
    _id: name,
    name: name,
    type: 'collection' as const,
    status: 'ready' as const,
    document_count: 0,
    document_size: 0,
    avg_document_size: 0,
    storage_size: 0,
    free_storage_size: 0,
    index_count: 0,
    index_size: 0,
    properties: [],
  };
}

const dbs = [
  createDatabase('foo'),
  createDatabase('bar'),
  createDatabase('buz'),
];

const colls = [
  createCollection('foo.foo'),
  createCollection('bar.bar'),
  createCollection('buz.buz'),
];

describe('databases and collections list', function () {
  describe('DatabasesList', function () {
    afterEach(cleanup);

    it('should render databases in a list', function () {
      const clickSpy = Sinon.spy();

      render(
        <DatabasesList
          databases={dbs}
          onDatabaseClick={clickSpy}
        ></DatabasesList>
      );

      expect(screen.getByTestId('database-grid')).to.exist;

      expect(screen.getAllByTestId('database-grid-item')).to.have.lengthOf(3);

      expect(screen.getByText('foo')).to.exist;
      expect(screen.getByText('bar')).to.exist;
      expect(screen.getByText('buz')).to.exist;

      userEvent.click(screen.getByText('foo'));

      expect(clickSpy).to.be.calledWith('foo');
    });
  });

  describe('CollectionsList', function () {
    afterEach(cleanup);

    it('should render collections in a list', function () {
      const clickSpy = Sinon.spy();

      render(
        <CollectionsList
          collections={colls}
          onCollectionClick={clickSpy}
        ></CollectionsList>
      );

      expect(screen.getByTestId('collection-grid')).to.exist;

      expect(screen.getAllByTestId('collection-grid-item')).to.have.lengthOf(3);

      expect(screen.getByText('foo.foo')).to.exist;
      expect(screen.getByText('bar.bar')).to.exist;
      expect(screen.getByText('buz.buz')).to.exist;

      userEvent.click(screen.getByText('bar.bar'));

      expect(clickSpy).to.be.calledWith('bar.bar');
    });
  });
});
