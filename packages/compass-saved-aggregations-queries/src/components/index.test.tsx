import React from 'react';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { createProxyquireMockForQueriesAndAggregationsPlugins } from '../../test/mock';
import { queries, pipelines } from '../../test/fixtures';

describe('AggregationsQueriesList', function () {
  // Even though we are mocking dependencies, the code is still processed by
  // ts-node (we're just not running it) so running this suite takes more time
  // than is allowed by our default configuration
  this.timeout(300000);

  afterEach(cleanup);

  it('should load queries and display them in the list', async function () {
    const { default: ConnectedList }: any = proxyquire.load('./index', {
      ...(createProxyquireMockForQueriesAndAggregationsPlugins(
        [],
        [
          {
            _id: '123',
            _name: 'Query',
            _ns: 'bar.foo',
            _dateSaved: 0,
          },
        ]
      ) as any),
      // XXX: It's important that the proxyquire required module has the same
      // instance of react that the code in this scope has, otherwise we will
      // get a "multiple React instances" error while trying to render the
      // component
      react: Object.assign(React, {
        '@global': true,
        '@noCallThru': true,
      }),
    });

    render(<ConnectedList></ConnectedList>);

    expect(await screen.findByText('Query')).to.exist;
  });

  it('should load aggregations and display them in the list', async function () {
    const { default: ConnectedList }: any = proxyquire.load('./index', {
      ...(createProxyquireMockForQueriesAndAggregationsPlugins(
        [
          {
            id: '123',
            name: 'Aggregation',
            namespace: 'foo.bar',
            lastModified: 0,
          },
        ],
        []
      ) as any),
      // XXX: It's important that the proxyquire required module has the same
      // instance of react that the code in this scope has, otherwise we will
      // get a "multiple React instances" error while trying to render the
      // component
      react: Object.assign(React, {
        '@global': true,
        '@noCallThru': true,
      }),
    });

    render(<ConnectedList></ConnectedList>);

    expect(await screen.findByText('Aggregation')).to.exist;
  });

  describe('copy to clipboard', function () {
    it('should copy query to the clipboard', async function () {
      const { default: ConnectedList }: any = proxyquire.load('./index', {
        ...(createProxyquireMockForQueriesAndAggregationsPlugins(
          [],
          [
            {
              _id: '123',
              _name: 'My Query',
              _ns: 'bar.foo',
              _dateSaved: 0,
              filter: { foo: 'bar' },
              sort: { bar: -1 },
            },
          ]
        ) as any),
        // XXX: It's important that the proxyquire required module has the same
        // instance of react that the code in this scope has, otherwise we will
        // get a "multiple React instances" error while trying to render the
        // component
        react: Object.assign(React, {
          '@global': true,
          '@noCallThru': true,
        }),
      });

      render(<ConnectedList></ConnectedList>);

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
      const { default: ConnectedList }: any = proxyquire.load('./index', {
        ...(createProxyquireMockForQueriesAndAggregationsPlugins(
          [
            {
              id: '123',
              name: 'My Aggregation',
              namespace: 'foo.bar',
              lastModified: 0,
              pipeline: [
                {
                  stageOperator: '$match',
                  stage: '{\n  "field": 42\n}',
                },
              ],
            },
          ],
          []
        ) as any),
        // XXX: It's important that the proxyquire required module has the same
        // instance of react that the code in this scope has, otherwise we will
        // get a "multiple React instances" error while trying to render the
        // component
        react: Object.assign(React, {
          '@global': true,
          '@noCallThru': true,
        }),
      });

      render(<ConnectedList></ConnectedList>);

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
      const { default: ConnectedList }: any = proxyquire.load('./index', {
        ...(createProxyquireMockForQueriesAndAggregationsPlugins(
          pipelines.map((item) => (item as any).aggregation),
          queries.map((item) => (item as any).query)
        ) as any),
        // XXX: It's important that the proxyquire required module has the same
        // instance of react that the code in this scope has, otherwise we will
        // get a "multiple React instances" error while trying to render the
        // component
        react: Object.assign(React, {
          '@global': true,
          '@noCallThru': true,
        }),
      });

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

    it('should delete an item', function () {
      const item = queries[0];
      const card = screen.getByTestId('grid-item-0');
      userEvent.hover(card);
      userEvent.click(within(card).getByLabelText(/show actions/i));
      userEvent.click(
        within(card).getByRole('menuitem', {
          name: /delete/i,
        })
      );

      const modal = screen.getByTestId('delete-item-modal');

      const title = new RegExp(
        `are you sure you want to delete your ${
          item.type === 'query' ? 'query' : 'aggregation'
        }?`,
        'i'
      );
      const description = /this action can not be undone/i;

      expect(within(modal).getByText(title), 'show title').to.exist;
      expect(within(modal).getByText(description), 'show description').to.exist;

      userEvent.click(
        within(modal).getByRole('button', {
          name: /delete/i,
        })
      );

      expect(() => {
        screen.getByTestId(/delete item modal/i);
      }, 'hides modal after deleting').to.throw;
    });
  });
});
