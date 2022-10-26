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
      preferencesReadOnly={false}
      description={undefined}
      error={null}
      localAppRegistry={appRegistry}
      isRefreshing={false}
      sortIndexes={() => {}}
      refreshIndexes={() => {}}
      dropFailedIndex={() => {}}
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

  it('renders indexes list with in progress index', function () {
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
        {
          cardinality: 'single',
          name: 'item',
          size: 0,
          relativeSize: 0,
          type: 'hashed',
          extra: {
            status: 'inprogress',
          },
          properties: [],
          fields: {
            serialize() {
              return [
                {
                  field: 'item',
                  value: 1,
                },
              ];
            },
          },
          usageCount: 0,
        },
      ],
      isReadonlyView: false,
      error: undefined,
    });

    const indexesList = screen.getByTestId('indexes-list');
    const inProgressIndex = within(indexesList).getByTestId('index-row-item');
    const indexPropertyField = within(inProgressIndex).getByTestId(
      'index-property-field'
    );

    expect(indexPropertyField).to.contain.text('In Progress...');

    const dropIndexButton = within(inProgressIndex).queryByTestId(
      'index-actions-delete-action'
    );
    expect(dropIndexButton).to.not.exist;
  });

  it('renders indexes list with failed index', function () {
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
        {
          cardinality: 'single',
          name: 'item',
          size: 0,
          relativeSize: 0,
          type: 'hashed',
          extra: {
            status: 'failed',
            error: 'Error message',
          },
          properties: [],
          fields: {
            serialize() {
              return [
                {
                  field: 'item',
                  value: 1,
                },
              ];
            },
          },
          usageCount: 0,
        },
      ],
      isReadonlyView: false,
      error: undefined,
    });

    const indexesList = screen.getByTestId('indexes-list');
    const failedIndex = within(indexesList).getByTestId('index-row-item');
    const indexPropertyField = within(failedIndex).getByTestId(
      'index-property-field'
    );

    expect(indexPropertyField).to.contain.text('Failed');

    const dropIndexButton = within(failedIndex).getByTestId(
      'index-actions-delete-action'
    );
    expect(dropIndexButton).to.exist;
  });
});
