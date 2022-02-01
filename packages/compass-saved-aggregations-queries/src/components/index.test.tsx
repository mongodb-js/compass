import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { _setPipelines } from '@mongodb-js/compass-aggregations';
import { _setQueries } from '@mongodb-js/compass-query-history';
import { expect } from 'chai';

import ConnectedList from './index';

describe('AggregationsQueriesList', function () {
  afterEach(function () {
    cleanup();
    _setPipelines();
    _setQueries();
  });

  it('should load aggregations and queries and display them in the list', async function () {
    _setPipelines([
      {
        id: '123',
        name: 'Aggregation',
        namespace: 'foo.bar',
        lastModified: 0,
      },
    ]);

    _setQueries([
      {
        _id: '123',
        _name: 'Query',
        _ns: 'bar.foo',
        _dateSaved: 0,
      },
    ]);

    render(<ConnectedList></ConnectedList>);

    // Waiting for the items to "load"
    await screen.findByText('My queries');

    expect(screen.getByText('Aggregation')).to.exist;
    expect(screen.getByText('Query')).to.exist;
  });
});
