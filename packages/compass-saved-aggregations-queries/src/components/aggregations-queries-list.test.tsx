import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import { AggregationsQueriesList } from './aggregations-queries-list';
import type { AggregationsQueriesListProps } from './aggregations-queries-list';
import { Provider } from 'react-redux';
import { configureStore } from '../stores';

function renderQueriesList(props: Partial<AggregationsQueriesListProps>) {
  const store = configureStore({
    globalAppRegistry: {} as any,
    dataService: {} as any,
    instance: {} as any,
    logger: {} as any,
    pipelineStorage: {} as any,
    queryStorage: {} as any,
  });

  return render(
    <Provider store={store}>
      <AggregationsQueriesList
        items={props.items ?? []}
        loading={props.loading ?? false}
        onCopyToClipboard={props.onCopyToClipboard ?? (() => {})}
        onDeleteItem={props.onDeleteItem ?? (() => {})}
        onEditItem={props.onEditItem ?? (() => {})}
        onOpenItem={props.onOpenItem ?? (() => {})}
        onMount={props.onMount ?? (() => {})}
      />
    </Provider>
  );
}

describe('AggregationsQueriesList', function () {
  afterEach(function () {
    cleanup();
  });

  it('should filter out updatemany queries', function () {
    renderQueriesList({
      items: [
        {
          type: 'query',
          name: 'shown',
          database: 'showndb',
          collection: 'showncoll',
        } as any,
        {
          type: 'updatemany',
          name: 'not shown',
          database: 'notshowndb',
          collection: 'notshowncoll',
        } as any,
      ],
    });

    expect(screen.getByText('shown')).to.exist;
    expect(screen.getByText('.find')).to.exist;
    expect(screen.queryByText('not shown')).to.not.exist;
    expect(screen.queryByText('.updatemany')).to.not.exist;
  });
});
