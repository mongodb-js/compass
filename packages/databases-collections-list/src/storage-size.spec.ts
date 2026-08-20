import { expect } from 'chai';
import { createDatabase, createCollection } from '../test/utils';
import { shouldShowStorageSizeColumn } from './storage-size';

describe('shouldShowStorageSizeColumn', function () {
  it('shows the column when stats are reported', function () {
    expect(
      shouldShowStorageSizeColumn([createDatabase({ storage_size: 1000 })])
    ).to.equal(true);
  });

  it('shows the column for a genuine zero', function () {
    expect(
      shouldShowStorageSizeColumn([createDatabase({ storage_size: 0 })])
    ).to.equal(true);
  });

  it('hides the column when no fetched row reports a storage size', function () {
    expect(
      shouldShowStorageSizeColumn([
        createDatabase({ status: 'ready' }),
        createDatabase({ status: 'refreshing' }),
      ])
    ).to.equal(false);
  });

  it('shows the column when only some rows report a storage size', function () {
    expect(
      shouldShowStorageSizeColumn([
        createDatabase({ status: 'ready' }),
        createDatabase({ status: 'ready', storage_size: 500 }),
      ])
    ).to.equal(true);
  });

  it('keeps the column while stats are still loading', function () {
    // Otherwise the column would be dropped on first render and reappear once
    // the stats arrive, shifting the table layout on every connection.
    expect(
      shouldShowStorageSizeColumn([
        createDatabase({ status: 'initial' }),
        createDatabase({ status: 'fetching' }),
      ])
    ).to.equal(true);
  });

  it('ignores rows whose stats could not be fetched', function () {
    // `config` and `local` sit in the `error` status on clusters where the user
    // cannot read their stats, on any deployment type.
    expect(
      shouldShowStorageSizeColumn([
        createDatabase({ status: 'error' }),
        createDatabase({ status: 'ready', storage_size: 1000 }),
      ])
    ).to.equal(true);
  });

  it('keeps the column when every row failed to fetch stats', function () {
    expect(
      shouldShowStorageSizeColumn([createDatabase({ status: 'error' })])
    ).to.equal(true);
  });

  it('keeps the column for an empty list', function () {
    expect(shouldShowStorageSizeColumn([])).to.equal(true);
  });

  it('hides the column when collections without storage size are fetched', function () {
    expect(
      shouldShowStorageSizeColumn([
        createCollection({ status: 'ready' }),
        createCollection({ status: 'ready' }),
      ])
    ).to.equal(false);
  });

  it('shows the column when a collection reports storage size', function () {
    expect(
      shouldShowStorageSizeColumn([
        createCollection({ status: 'ready', storage_size: 500 }),
      ])
    ).to.equal(true);
  });

  it('ignores views when determining visibility', function () {
    expect(
      shouldShowStorageSizeColumn([
        createCollection({ type: 'view', status: 'ready' }),
        createDatabase({ status: 'ready', storage_size: 1000 }),
      ])
    ).to.equal(true);
  });
});
