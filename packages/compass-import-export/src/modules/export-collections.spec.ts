import { expect } from 'chai';

import {
  ExportCollectionsActionTypes,
  exportCollectionsReducer,
  initialState,
  toggleAllCollections,
  toggleCollection,
  closeExportCollections,
} from './export-collections';
import type { ExportCollectionsState } from './export-collections';

const collections = [
  { name: 'customers', isView: false, count: 50 },
  { name: 'orders', isView: false, count: 200 },
  { name: 'vip_customers', isView: true, count: undefined },
];

function loadedState(): ExportCollectionsState {
  const opened = exportCollectionsReducer(initialState, {
    type: ExportCollectionsActionTypes.Open,
    connectionId: 'connection-1',
    databaseName: 'store',
  } as any);
  return exportCollectionsReducer(opened, {
    type: ExportCollectionsActionTypes.LoadCollectionsSuccess,
    collections,
  } as any);
}

describe('exportCollectionsReducer', function () {
  it('opens in the loading state for the database', function () {
    const state = exportCollectionsReducer(initialState, {
      type: ExportCollectionsActionTypes.Open,
      connectionId: 'connection-1',
      databaseName: 'store',
    } as any);
    expect(state.isOpen).to.equal(true);
    expect(state.databaseName).to.equal('store');
    expect(state.status).to.equal('loading-collections');
  });

  it('selects every collection but not views once loaded', function () {
    const state = loadedState();
    expect(state.status).to.equal('select-collections');
    expect(state.selectedCollections).to.deep.equal(['customers', 'orders']);
  });

  it('toggles a collection and keeps the list order', function () {
    let state = loadedState();
    state = exportCollectionsReducer(state, toggleCollection('customers'));
    expect(state.selectedCollections).to.deep.equal(['orders']);
    state = exportCollectionsReducer(state, toggleCollection('customers'));
    expect(state.selectedCollections).to.deep.equal(['customers', 'orders']);
  });

  it('toggles all selectable collections', function () {
    let state = loadedState();
    state = exportCollectionsReducer(state, toggleAllCollections());
    expect(state.selectedCollections).to.deep.equal([]);
    state = exportCollectionsReducer(state, toggleAllCollections());
    expect(state.selectedCollections).to.deep.equal(['customers', 'orders']);
  });

  it('ignores collections loaded after the modal was closed', function () {
    const opened = exportCollectionsReducer(initialState, {
      type: ExportCollectionsActionTypes.Open,
      connectionId: 'connection-1',
      databaseName: 'store',
    } as any);
    const closed = exportCollectionsReducer(opened, closeExportCollections());
    const state = exportCollectionsReducer(closed, {
      type: ExportCollectionsActionTypes.LoadCollectionsSuccess,
      collections,
    } as any);
    expect(state).to.deep.equal(initialState);
  });

  it('hides the modal but keeps the state while an export runs', function () {
    const abortController = new AbortController();
    let state = exportCollectionsReducer(loadedState(), {
      type: ExportCollectionsActionTypes.RunExport,
      exportAbortController: abortController,
    } as any);
    expect(state.isOpen).to.equal(false);
    expect(state.status).to.equal('in-progress');

    state = exportCollectionsReducer(state, closeExportCollections());
    expect(state.exportAbortController).to.equal(abortController);

    state = exportCollectionsReducer(state, {
      type: ExportCollectionsActionTypes.ExportFinished,
    } as any);
    expect(state).to.deep.equal(initialState);
  });
});
