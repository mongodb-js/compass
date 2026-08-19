import React from 'react';
import { expect } from 'chai';
import {
  render,
  screen,
  cleanup,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { CrudTabTitle } from './plugin-title';
import type { CrudStore } from './stores/crud-store';

async function renderTitleAndOpenTooltip(collectionStats: unknown) {
  render(
    <CrudTabTitle
      store={{ state: { collectionStats } } as unknown as CrudStore}
    />
  );

  // The tooltip trigger is the badge inside the stats container, so hovering the
  // container itself would not open it.
  userEvent.hover(screen.getByText('10'));

  await waitFor(
    function () {
      expect(screen.getByRole('tooltip')).to.exist;
    },
    { timeout: 5000 }
  );

  return screen.getByRole('tooltip').textContent ?? '';
}

describe('CrudTabTitle', function () {
  afterEach(cleanup);

  it('shows the storage size when the server reported it', async function () {
    const tooltipText = await renderTitleAndOpenTooltip({
      document_count: 10,
      storage_size: 4266,
      free_storage_size: 0,
      avg_document_size: 22,
    });

    expect(tooltipText).to.include('Documents: 10');
    expect(tooltipText).to.include('Storage Size:');
    expect(tooltipText).to.include('Avg. Size:');
  });

  it('omits the storage size when the server did not report it', async function () {
    // Atlas disaggregated storage clusters filter storageSize out of $collStats
    // for non-internal users. Showing "0 B" or "N/A" would both be misleading.
    const tooltipText = await renderTitleAndOpenTooltip({
      document_count: 10,
      storage_size: undefined,
      free_storage_size: undefined,
      avg_document_size: 22,
    });

    expect(tooltipText).to.include('Documents: 10');
    expect(tooltipText).to.not.include('Storage Size');
    expect(tooltipText).to.include('Avg. Size:');
  });
});
