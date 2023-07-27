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
import { FavoriteQueryStorage } from '@mongodb-js/compass-query-bar';
import { PipelineStorage } from '@mongodb-js/compass-aggregations';
import ConnectedList from './index';
import * as store from './../stores';

import { queries, pipelines } from '../../test/fixtures';
import Sinon from 'sinon';

const DATE = new Date('01/01/2020');

describe('AggregationsQueriesList', function () {
  let sandbox: Sinon.SinonSandbox;
  let favoriteQueryStorageMock: Sinon.SinonMock;
  let pipelineStorageMock: Sinon.SinonMock;

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
    favoriteQueryStorageMock = sandbox.mock(FavoriteQueryStorage.prototype);
    pipelineStorageMock = sandbox.mock(PipelineStorage.prototype);

    sandbox.stub(store, 'queryStorage').returns(favoriteQueryStorageMock);
    sandbox.stub(store, 'pipelineStorage').returns(pipelineStorageMock);
  });

  afterEach(function () {
    sandbox.restore();
    cleanup();
  });

  it('should display no saved items when user has no saved queries/aggregations', async function () {
    favoriteQueryStorageMock.expects('loadAll').resolves([]);
    pipelineStorageMock.expects('loadAll').resolves([]);

    render(<ConnectedList></ConnectedList>);
    expect(await screen.findByText('No saved queries yet.')).to.exist;
  });

  it('should load queries and display them in the list', async function () {
    favoriteQueryStorageMock.expects('loadAll').resolves([
      {
        _id: '123',
        _name: 'Query',
        _ns: 'bar.foo',
        _dateSaved: DATE,
      },
    ]);
    pipelineStorageMock.expects('loadAll').resolves([]);
    render(<ConnectedList></ConnectedList>);
    expect(await screen.findByText('Query')).to.exist;
  });

  it('should load aggregations and display them in the list', async function () {
    favoriteQueryStorageMock.expects('loadAll').resolves([]);
    pipelineStorageMock.expects('loadAll').resolves([
      {
        id: '123',
        name: 'Aggregation',
        namespace: 'foo.bar',
        lastModified: 0,
      },
    ]);
    render(<ConnectedList></ConnectedList>);
    expect(await screen.findByText('Aggregation')).to.exist;
  });

  describe('copy to clipboard', function () {
    it('should copy query to the clipboard', async function () {
      favoriteQueryStorageMock.expects('loadAll').resolves([
        {
          _id: '123',
          _name: 'My Query',
          _ns: 'bar.foo',
          _dateSaved: DATE,
          filter: { foo: 'bar' },
          sort: { bar: -1 },
        },
      ]);
      pipelineStorageMock.expects('loadAll').resolves([]);

      render(<ConnectedList></ConnectedList>);

      await waitFor(async () => await screen.findByText('My Query'));

      const card = await screen.findByRole('gridcell');

      userEvent.hover(card);

      userEvent.click(within(card).getByLabelText(/show actions/i));
      userEvent.click(within(card).getByText('Copy'));

      expect(await navigator.clipboard.readText()).to.eq(`{
  "collation": null,
  "filter": {
    "foo": "bar"
  },
  "limit": null,
  "project": null,
  "skip": null,
  "sort": {
    "bar": -1
  }
}`);
    });

    it('should copy aggregation to the clipboard', async function () {
      favoriteQueryStorageMock.expects('loadAll').resolves([]);
      pipelineStorageMock.expects('loadAll').resolves([
        {
          id: '123',
          name: 'My Aggregation',
          namespace: 'foo.bar',
          lastModified: 0,
          pipelineText: `[
  {
    $match: {
      "field": 42
    }
  }
]`,
        },
      ]);

      render(<ConnectedList></ConnectedList>);

      await waitFor(async () => await screen.findByText('My Aggregation'));

      const card = await screen.findByRole('gridcell');

      userEvent.hover(card);

      userEvent.click(within(card).getByLabelText(/show actions/i));
      userEvent.click(within(card).getByText('Copy'));

      expect(await navigator.clipboard.readText()).to.eq(`[
  {
    $match: {
      "field": 42
    }
  }
]`);
    });
  });

  context('with fixtures', function () {
    beforeEach(async function () {
      favoriteQueryStorageMock
        .expects('loadAll')
        .resolves(queries.map((item) => (item as any).query));
      pipelineStorageMock
        .expects('loadAll')
        .resolves(pipelines.map((item) => (item as any).aggregation));
      render(<ConnectedList></ConnectedList>);

      // Wait for the items to "load"
      await screen.findByText(queries[0].name);
    });

    it('should filter items by database/collection', function () {
      const { database, collection } = queries[0];

      // select database
      userEvent.click(screen.getByText('All databases'), undefined, {
        skipPointerEventsCheck: true,
      });
      userEvent.click(
        screen.getByRole('option', {
          name: database,
        }),
        undefined,
        { skipPointerEventsCheck: true }
      );

      // select collection
      userEvent.click(screen.getByText('All collections'), undefined, {
        skipPointerEventsCheck: true,
      });
      userEvent.click(
        screen.getByRole('option', {
          name: collection,
        }),
        undefined,
        { skipPointerEventsCheck: true }
      );

      const expectedItems = [...queries, ...pipelines].filter(
        (item) => item.database === database && item.collection === collection
      );

      expectedItems.forEach((item) => {
        expect(screen.getByText(item.name)).to.exist;
      });
    });

    it('should rename an item', async function () {
      const item = queries[0];

      const updatedName = 'the updated name';

      // The first item is a query, so we are mocking that
      favoriteQueryStorageMock.expects('updateAttributes').resolves({
        ...(item as any).query,
        _name: updatedName,
      });

      const card = document.querySelector<HTMLElement>(
        `[data-id="${item.id}"]`
      );

      if (!card) {
        throw new Error('Expected card to exist');
      }

      userEvent.hover(card);
      userEvent.click(within(card).getByLabelText('Show actions'));
      userEvent.click(within(card).getByText('Rename'));

      const modal = screen.getByTestId('edit-item-modal');

      const title = new RegExp('rename query', 'i');
      expect(within(modal).getByText(title), 'show title').to.exist;

      const nameInput = within(modal).getByRole<HTMLInputElement>('textbox', {
        name: /name/i,
      });

      expect(nameInput, 'show name input').to.exist;
      expect(nameInput.value, 'input with item name').to.equal(item.name);

      expect(
        within(modal).getByRole<HTMLButtonElement>('button', {
          name: /update/i,
        }).disabled,
        'submit button is disabled when user has not changed field value'
      ).to.be.true;

      userEvent.clear(nameInput);
      expect(
        within(modal).getByRole<HTMLButtonElement>('button', {
          name: /update/i,
        }).disabled,
        'submit button is disabled when field value is empty'
      ).to.be.true;

      userEvent.type(nameInput, updatedName);
      userEvent.click(
        within(modal).getByRole<HTMLButtonElement>('button', {
          name: /update/i,
        })
      );

      await waitFor(() => {
        expect(screen.queryByText(item.name)).to.not.exist;
        expect(screen.getByText(updatedName)).to.exist;
      });
    });

    it('should not update an item if rename was not confirmed', async function () {
      const item = queries[0];
      const card = document.querySelector<HTMLElement>(
        `[data-id="${item.id}"]`
      );

      if (!card) {
        throw new Error('Expected card to exist');
      }

      userEvent.hover(card);
      userEvent.click(within(card).getByLabelText('Show actions'));
      userEvent.click(within(card).getByText('Rename'));

      const modal = await screen.findByTestId('edit-item-modal');

      userEvent.click(within(modal).getByText('Cancel'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(screen.queryByText(item.name)).to.exist;
    });
  });
});
