import { expect } from 'chai';
import { shouldShowStorageSizeColumn } from './storage-size';

describe('shouldShowStorageSizeColumn', function () {
  it('shows the column when stats are reported', function () {
    expect(
      shouldShowStorageSizeColumn([{ status: 'ready', storage_size: 1000 }])
    ).to.equal(true);
  });

  it('shows the column for a genuine zero', function () {
    expect(
      shouldShowStorageSizeColumn([{ status: 'ready', storage_size: 0 }])
    ).to.equal(true);
  });

  it('hides the column when no fetched row reports a storage size', function () {
    expect(
      shouldShowStorageSizeColumn([
        { status: 'ready', storage_size: undefined },
        { status: 'refreshing', storage_size: undefined },
      ])
    ).to.equal(false);
  });

  it('shows the column when only some rows report a storage size', function () {
    expect(
      shouldShowStorageSizeColumn([
        { status: 'ready', storage_size: undefined },
        { status: 'ready', storage_size: 500 },
      ])
    ).to.equal(true);
  });

  it('keeps the column while stats are still loading', function () {
    // Otherwise the column would be dropped on first render and reappear once
    // the stats arrive, shifting the table layout on every connection.
    expect(
      shouldShowStorageSizeColumn([
        { status: 'initial', storage_size: undefined },
        { status: 'fetching', storage_size: undefined },
      ])
    ).to.equal(true);
  });

  it('ignores rows whose stats could not be fetched', function () {
    // `config` and `local` sit in the `error` status on clusters where the user
    // cannot read their stats, on any deployment type.
    expect(
      shouldShowStorageSizeColumn([
        { status: 'error', storage_size: undefined },
        { status: 'ready', storage_size: 1000 },
      ])
    ).to.equal(true);
  });

  it('keeps the column when every row failed to fetch stats', function () {
    expect(
      shouldShowStorageSizeColumn([
        { status: 'error', storage_size: undefined },
      ])
    ).to.equal(true);
  });

  it('keeps the column for an empty list', function () {
    expect(shouldShowStorageSizeColumn([])).to.equal(true);
  });
});
