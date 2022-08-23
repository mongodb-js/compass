import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import { Indexes } from './indexes';

const renderIndexes = (
  props: Partial<React.ComponentProps<typeof Indexes>> = {}
) => {
  const appRegistry = new AppRegistry();
  render(
    <Indexes
      indexes={[]}
      isWritable={true}
      isReadonly={false}
      isReadonlyView={false}
      description={undefined}
      error={undefined}
      localAppRegistry={appRegistry}
      isRefreshing={false}
      onSortTable={() => {}}
      onRefresh={() => {}}
      {...props}
    />
  );
};

describe('Indexes Component', function () {
  before(cleanup);
  afterEach(cleanup);

  it('renders indexes card', function () {
    renderIndexes();
    expect(screen.getByTestId('indexes')).to.exist;
  });

  it('renders indexes toolbar', function () {
    renderIndexes();
    expect(screen.getByTestId('indexes-toolbar')).to.exist;
  });

  it('does not render indexes list when its a readonly view', function () {
    renderIndexes({
      indexes: [],
      isReadonlyView: true,
      error: undefined,
    });
    expect(() => {
      screen.getByTestId('indexes-list');
    }).to.throw;
  });
  it('does not render indexes list when there is an error', function () {
    renderIndexes({
      indexes: [],
      isReadonlyView: false,
      error: 'Some random error',
    });
    expect(() => {
      screen.getByTestId('indexes-list');
    }).to.throw;
  });
  it('renders indexes list', function () {
    renderIndexes({
      indexes: [
        {
          cardinality: 'single',
          name: '_id_',
          size: 12,
          relativeSize: 20,
          type: 'hashed',
          extra: {},
          properties: ['unique'],
          fields: {
            serialize() {
              return [
                {
                  field: '_id',
                  value: 1,
                },
              ];
            },
          },
          usageCount: 20,
        },
      ],
      isReadonlyView: false,
      error: undefined,
    });

    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;
    expect(within(indexesList).getByTestId('index-row-_id_')).to.exist;
  });
});
