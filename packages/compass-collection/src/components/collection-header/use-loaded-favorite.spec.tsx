import React from 'react';
import { expect } from 'chai';
import { act, render, cleanup } from '@mongodb-js/testing-library-compass';
import {
  AppRegistry,
  AppRegistryProvider,
  GlobalAppRegistryProvider,
} from '@mongodb-js/compass-app-registry';

import { useLoadedFavorite } from './use-loaded-favorite';

// Match the symbols hard-coded in the hook. If they change, both sides
// must be updated in lock-step — the duplication is intentional, see
// the hook's own comment.
const LOADED_FAVORITE_EVENT = 'query-bar:loaded-favorite-changed';
const LOADED_FAVORITE_STICKY_KEY = '_compassQueryBarLoadedFavorite';

function Probe() {
  const info = useLoadedFavorite();
  return (
    <div
      data-testid="probe"
      data-name={info.name ?? ''}
      data-dirty={info.isDirty ? 'true' : 'false'}
    />
  );
}

function renderWithRegistry(registry: AppRegistry) {
  // Pass the registry as the local one so the hook's
  // `useLocalAppRegistry()` returns exactly the instance we're
  // emitting on / stashing into.
  return render(
    <GlobalAppRegistryProvider value={new AppRegistry()}>
      <AppRegistryProvider localAppRegistry={registry} deactivateOnUnmount>
        <Probe />
      </AppRegistryProvider>
    </GlobalAppRegistryProvider>
  );
}

function readProbe() {
  const el = document.querySelector(
    '[data-testid="probe"]'
  ) as HTMLElement | null;
  if (!el) throw new Error('probe not mounted');
  return {
    name: el.getAttribute('data-name') || '',
    isDirty: el.getAttribute('data-dirty') === 'true',
  };
}

describe('useLoadedFavorite', function () {
  afterEach(cleanup);

  it('returns empty state when no producer has emitted', function () {
    const reg = new AppRegistry();
    renderWithRegistry(reg);
    expect(readProbe()).to.deep.equal({ name: '', isDirty: false });
  });

  it('reads the sticky value synchronously on mount (producer activated first)', function () {
    const reg = new AppRegistry();
    // Simulate the query-bar producer having activated before the
    // header mounted — sticky value is what makes the breadcrumb
    // appear on first paint without flicker.
    (reg as unknown as Record<string, unknown>)[LOADED_FAVORITE_STICKY_KEY] = {
      name: 'Trips to station 470',
      isDirty: false,
    };
    renderWithRegistry(reg);
    expect(readProbe()).to.deep.equal({
      name: 'Trips to station 470',
      isDirty: false,
    });
  });

  it('updates when the producer emits a new payload', function () {
    const reg = new AppRegistry();
    renderWithRegistry(reg);
    expect(readProbe()).to.deep.equal({ name: '', isDirty: false });
    act(() => {
      reg.emit(LOADED_FAVORITE_EVENT, {
        name: 'Active customers',
        isDirty: false,
      });
    });
    expect(readProbe()).to.deep.equal({
      name: 'Active customers',
      isDirty: false,
    });
    act(() => {
      reg.emit(LOADED_FAVORITE_EVENT, {
        name: 'Active customers',
        isDirty: true,
      });
    });
    expect(readProbe()).to.deep.equal({
      name: 'Active customers',
      isDirty: true,
    });
  });

  it('clears when the producer broadcasts the empty state', function () {
    const reg = new AppRegistry();
    (reg as unknown as Record<string, unknown>)[LOADED_FAVORITE_STICKY_KEY] = {
      name: 'Active customers',
      isDirty: false,
    };
    renderWithRegistry(reg);
    expect(readProbe().name).to.equal('Active customers');
    act(() => {
      reg.emit(LOADED_FAVORITE_EVENT, { name: null, isDirty: false });
    });
    expect(readProbe()).to.deep.equal({ name: '', isDirty: false });
  });

  it('removes its listener on unmount', function () {
    const reg = new AppRegistry();
    const { unmount } = renderWithRegistry(reg);
    expect(reg.listeners(LOADED_FAVORITE_EVENT).length).to.be.greaterThan(0);
    unmount();
    expect(reg.listeners(LOADED_FAVORITE_EVENT).length).to.equal(0);
  });
});
