import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { createProxyquireMockForQueriesAndAggregationsPlugins } from '../../test/mock';

describe('AggregationsQueriesList', function () {
  // Even though we are mocking dependencies, the code is still processed by
  // ts-node (we're just not running it) so running this suite takes more time
  // than is allowed by our default configuration
  this.timeout(30000)

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
});
