import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import type { RegularIndex } from '../../modules/regular-indexes';
import { Indexes } from './indexes';

const renderIndexes = (
  props: Partial<React.ComponentProps<typeof Indexes>> = {}
) => {
  const appRegistry = new AppRegistry();
  render(
    <Indexes
      indexes={[]}
      searchIndexes={[]}
      isWritable={true}
      isReadonlyView={false}
      readOnly={false}
      description={undefined}
      regularError={null}
      searchError={null}
      localAppRegistry={appRegistry}
      isRefreshing={false}
      serverVersion="4.4.0"
      sortRegularIndexes={() => {}}
      sortSearchIndexes={() => {}}
      refreshIndexes={() => {}}
      dropFailedIndex={() => {}}
      onHideIndex={() => {}}
      onUnhideIndex={() => {}}
      isAtlasSearchSupported={false}
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

  it('does not render indexes toolbar when its a readonly view', function () {
    renderIndexes({
      indexes: [],
      isReadonlyView: true,
      regularError: undefined,
    });
    expect(() => {
      screen.getByTestId('indexes-toolbar');
    }).to.throw;
  });

  it('renders indexes toolbar when there is an regularError', function () {
    renderIndexes({
      indexes: [],
      isReadonlyView: false,
      regularError: 'Some random regularError',
    });
    expect(screen.getByTestId('indexes-toolbar')).to.exist;
  });

  it('does not render indexes list when its a readonly view', function () {
    renderIndexes({
      indexes: [],
      isReadonlyView: true,
      regularError: undefined,
    });
    expect(() => {
      screen.getByTestId('indexes-list');
    }).to.throw;
  });

  it('does not render indexes list when there is an regularError', function () {
    renderIndexes({
      indexes: [],
      isReadonlyView: false,
      regularError: 'Some random regularError',
    });
    expect(() => {
      screen.getByTestId('indexes-list');
    }).to.throw;
  });

  it('renders indexes list', function () {
    renderIndexes({
      indexes: [
        {
          ns: 'db.coll',
          cardinality: 'single',
          name: '_id_',
          size: 12,
          relativeSize: 20,
          type: 'hashed',
          extra: {},
          properties: ['unique'],
          fields: [
            {
              field: '_id',
              value: 1,
            },
          ],
          usageCount: 20,
        },
      ] as RegularIndex[],
      isReadonlyView: false,
      regularError: undefined,
    });

    const indexesList = screen.getByTestId('indexes-list');
    expect(indexesList).to.exist;
    expect(within(indexesList).getByTestId('index-row-_id_')).to.exist;
  });

  it('renders indexes list with in progress index', function () {
    renderIndexes({
      indexes: [
        {
          ns: 'db.coll',
          cardinality: 'single',
          name: '_id_',
          size: 12,
          relativeSize: 20,
          type: 'hashed',
          extra: {},
          properties: ['unique'],
          fields: [
            {
              field: '_id',
              value: 1,
            },
          ],
          usageCount: 20,
        },
        {
          ns: 'db.coll',
          cardinality: 'single',
          name: 'item',
          size: 0,
          relativeSize: 0,
          type: 'hashed',
          extra: {
            status: 'inprogress',
          },
          properties: [],
          fields: [
            {
              field: 'item',
              value: 1,
            },
          ],
          usageCount: 0,
        },
      ] as RegularIndex[],
      isReadonlyView: false,
      regularError: undefined,
    });

    const indexesList = screen.getByTestId('indexes-list');
    const inProgressIndex = within(indexesList).getByTestId('index-row-item');
    const indexPropertyField = within(inProgressIndex).getByTestId(
      'index-property-field'
    );

    expect(indexPropertyField).to.contain.text('In Progress ...');

    const dropIndexButton = within(inProgressIndex).queryByTestId(
      'index-actions-delete-action'
    );
    expect(dropIndexButton).to.not.exist;
  });

  it('renders indexes list with failed index', function () {
    renderIndexes({
      indexes: [
        {
          ns: 'db.coll',
          cardinality: 'single',
          name: '_id_',
          size: 12,
          relativeSize: 20,
          type: 'hashed',
          extra: {},
          properties: ['unique'],
          fields: [
            {
              field: '_id',
              value: 1,
            },
          ],
          usageCount: 20,
        },
        {
          ns: 'db.coll',
          cardinality: 'single',
          name: 'item',
          size: 0,
          relativeSize: 0,
          type: 'hashed',
          extra: {
            status: 'failed',
            regularError: 'regularError message',
          },
          properties: [],
          fields: [
            {
              field: 'item',
              value: 1,
            },
          ],
          usageCount: 0,
        },
      ] as RegularIndex[],
      isReadonlyView: false,
      regularError: undefined,
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
