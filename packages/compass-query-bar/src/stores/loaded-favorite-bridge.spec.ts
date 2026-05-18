import React, { useEffect, useState } from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import {
  AppRegistry,
  AppRegistryProvider,
  GlobalAppRegistryProvider,
} from '@mongodb-js/compass-app-registry';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import {
  render,
  waitFor,
  cleanup,
  act,
} from '@mongodb-js/testing-library-compass';

import { activatePlugin } from './query-bar-store';
import { applyFromHistory } from './query-bar-reducer';
import {
  LOADED_FAVORITE_EVENT,
  LOADED_FAVORITE_RENAME_KEY,
  LOADED_FAVORITE_STICKY_KEY,
  type LoadedFavoritePayload,
  type RenameLoadedFavorite,
} from '../loaded-favorite-bridge';

/**
 * Stand-up of activatePlugin with just enough scaffolding to drive the
 * loaded-favorite store → localAppRegistry bridge. Returns the live
 * `store`, the `localAppRegistry` (the same instance the bridge writes
 * to), and a `helpers` object that mimics the ones registerCompassPlugin
 * would supply.
 */
async function setupBridge(
  opts: {
    favorites?: Array<{ _id: string; _name: string; filter?: unknown }>;
    updateAttributesStub?: sinon.SinonStub;
  } = {}
) {
  const localAppRegistry = new AppRegistry();
  const preferences = await createSandboxFromDefaultPreferences();
  const loadAllStub = sinon.stub().resolves((opts.favorites as never[]) ?? []);
  const updateAttributesStub =
    opts.updateAttributesStub ?? sinon.stub().resolves();
  const helpers = {
    on: sinon.stub(),
    cleanup: sinon.stub(),
    addCleanup: sinon.stub(),
    signal: new AbortController().signal,
  };
  const { store } = activatePlugin(
    {
      namespace: 'test.coll',
      isReadonly: false,
      serverVersion: '6.0.0',
      isSearchIndexesSupported: true,
      isTimeSeries: false,
      isClustered: false,
      isFLE: false,
      isDataLake: false,
      isAtlas: false,
    } as never,
    {
      localAppRegistry,
      globalAppRegistry: new AppRegistry(),
      dataService: {
        sample: sinon.stub().resolves([]),
        getConnectionString: sinon
          .stub()
          .returns({ hosts: ['localhost:27017'] }),
      },
      recentQueryStorageAccess: {
        getStorage: () => ({ loadAll: loadAllStub }),
      },
      favoriteQueryStorageAccess: {
        getStorage: () => ({
          loadAll: loadAllStub,
          updateAttributes: updateAttributesStub,
        }),
      },
      atlasAiService: {} as never,
      preferences,
      logger: createNoopLogger(),
      track: createNoopTrack(),
      instance: { isWritable: true, on: sinon.stub() },
    } as never,
    helpers as never
  );
  // Wait for fetchSavedQueries to settle so `state.favoriteQueries`
  // matches our `opts.favorites` fixture before the body of the test
  // dispatches applyFromHistory.
  await waitFor(() => {
    expect(store.getState().queryBar.favoriteQueries.length).to.equal(
      opts.favorites?.length ?? 0
    );
  });
  return { store, localAppRegistry, helpers, updateAttributesStub };
}

// Test consumer mirroring what `compass-collection`'s `useLoadedFavorite`
// hook does — minimal, no third-party deps, so it's clear *exactly*
// what the bridge contract requires of consumers. If this stays in
// sync with the real hook and both pass, the production wiring works.
function ProbeComponent({
  registry,
  onChange,
}: {
  registry: AppRegistry;
  onChange?: (info: { name: string | null; isDirty: boolean }) => void;
}) {
  const initial = (
    registry as unknown as Record<
      string,
      { name: string | null; isDirty: boolean } | undefined
    >
  )[LOADED_FAVORITE_STICKY_KEY] ?? { name: null, isDirty: false };
  const [info, setInfo] = useState(initial);
  useEffect(() => {
    const handler = (p: { name: string | null; isDirty: boolean }) => {
      setInfo(p);
      onChange?.(p);
    };
    registry.on(LOADED_FAVORITE_EVENT, handler);
    return () => {
      registry.removeListener(LOADED_FAVORITE_EVENT, handler);
    };
  }, [registry, onChange]);
  return React.createElement(
    'div',
    {
      'data-testid': 'probe',
      'data-name': info.name ?? '',
      'data-dirty': info.isDirty ? 'true' : 'false',
    },
    info.name
  );
}

describe('loaded-favorite bridge (producer side)', function () {
  afterEach(() => {
    sinon.restore();
    cleanup();
  });

  it('on activation, stashes an initial empty payload on the registry', async function () {
    const { localAppRegistry } = await setupBridge();
    const sticky = (
      localAppRegistry as unknown as Record<string, LoadedFavoritePayload>
    )[LOADED_FAVORITE_STICKY_KEY];
    // The initial broadcast runs once at activate time. With no
    // favorite loaded, the payload is the empty shape — and the sticky
    // value reflects exactly that, so a late-mounting subscriber
    // doesn't see `undefined` and accidentally render stale content.
    expect(sticky).to.deep.equal({ name: null, isDirty: false });
  });

  it('emits + stashes the loaded favorite name when applyFromHistory dispatches with a favoriteId', async function () {
    const fav = { _id: 'fav-1', _name: 'Active customers', filter: { x: 1 } };
    const { store, localAppRegistry } = await setupBridge({
      favorites: [fav],
    });
    const heard: LoadedFavoritePayload[] = [];
    localAppRegistry.on(LOADED_FAVORITE_EVENT, (p: LoadedFavoritePayload) =>
      heard.push(p)
    );

    store.dispatch(
      applyFromHistory({ filter: { x: 1 } }, [], { favoriteId: 'fav-1' })
    );

    await waitFor(() => {
      expect(heard.length).to.be.greaterThan(0);
    });
    const last = heard[heard.length - 1];
    expect(last.name).to.equal('Active customers');
    expect(last.isDirty).to.equal(false);

    const sticky = (
      localAppRegistry as unknown as Record<string, LoadedFavoritePayload>
    )[LOADED_FAVORITE_STICKY_KEY];
    expect(sticky).to.deep.equal(last);
  });

  describe('end-to-end: producer + React consumer on the same registry', function () {
    it('a probe component mounted AFTER activate sees the loaded favorite via the sticky value (no flicker)', async function () {
      // 1. Activate the plugin first (producer wires its store
      //    subscription + writes the sticky value).
      const fav = {
        _id: 'fav-1',
        _name: 'Trips to station 470',
        filter: { x: 1 },
      };
      const { store, localAppRegistry } = await setupBridge({
        favorites: [fav],
      });
      // 2. Load a favorite BEFORE the consumer mounts — this is the
      //    race that broke the earlier version (sticky was never
      //    written when payload matched lastBroadcast=={null,false}).
      store.dispatch(
        applyFromHistory({ filter: { x: 1 } }, [], { favoriteId: 'fav-1' })
      );
      // 3. Now mount the consumer reading from the SAME registry.
      render(
        React.createElement(
          GlobalAppRegistryProvider,
          { value: new AppRegistry() },
          React.createElement(
            AppRegistryProvider,
            { localAppRegistry, deactivateOnUnmount: false },
            React.createElement(ProbeComponent, { registry: localAppRegistry })
          )
        )
      );
      // Probe should have the favorite name on first paint — no need
      // to wait for an emit, because the sticky read in useState's
      // initializer captures the producer's last-broadcast value.
      const probe = document.querySelector(
        '[data-testid="probe"]'
      ) as HTMLElement;
      expect(probe).to.exist;
      expect(probe.getAttribute('data-name')).to.equal('Trips to station 470');
    });

    it('a probe component mounted BEFORE activate receives the favorite via the emit', async function () {
      const localAppRegistry = new AppRegistry();
      // Mount consumer first.
      render(
        React.createElement(
          GlobalAppRegistryProvider,
          { value: new AppRegistry() },
          React.createElement(
            AppRegistryProvider,
            { localAppRegistry, deactivateOnUnmount: false },
            React.createElement(ProbeComponent, { registry: localAppRegistry })
          )
        )
      );
      // Now activate the producer against the same registry.
      const fav = {
        _id: 'fav-1',
        _name: 'Active customers',
        filter: { x: 1 },
      };
      const preferences = await createSandboxFromDefaultPreferences();
      const loadAllStub = sinon.stub().resolves([fav] as never[]);
      const updateAttributesStub = sinon.stub().resolves();
      const { store } = activatePlugin(
        {
          namespace: 'test.coll',
          isReadonly: false,
          serverVersion: '6.0.0',
          isSearchIndexesSupported: true,
          isTimeSeries: false,
          isClustered: false,
          isFLE: false,
          isDataLake: false,
          isAtlas: false,
        } as never,
        {
          localAppRegistry,
          globalAppRegistry: new AppRegistry(),
          dataService: {
            sample: sinon.stub().resolves([]),
            getConnectionString: sinon
              .stub()
              .returns({ hosts: ['localhost:27017'] }),
          },
          recentQueryStorageAccess: {
            getStorage: () => ({ loadAll: loadAllStub }),
          },
          favoriteQueryStorageAccess: {
            getStorage: () => ({
              loadAll: loadAllStub,
              updateAttributes: updateAttributesStub,
            }),
          },
          atlasAiService: {} as never,
          preferences,
          logger: createNoopLogger(),
          track: createNoopTrack(),
          instance: { isWritable: true, on: sinon.stub() },
        } as never,
        {
          on: () => {},
          cleanup: () => {},
          addCleanup: () => {},
        } as never
      );
      await waitFor(() => {
        expect(store.getState().queryBar.favoriteQueries.length).to.equal(1);
      });
      act(() => {
        store.dispatch(
          applyFromHistory({ filter: { x: 1 } }, [], { favoriteId: 'fav-1' })
        );
      });
      await waitFor(() => {
        const probe = document.querySelector(
          '[data-testid="probe"]'
        ) as HTMLElement;
        expect(probe.getAttribute('data-name')).to.equal('Active customers');
      });
    });
  });

  describe('rename callback', function () {
    it('is stashed on the registry under the rename key', async function () {
      const { localAppRegistry } = await setupBridge();
      const callback = (localAppRegistry as unknown as Record<string, unknown>)[
        LOADED_FAVORITE_RENAME_KEY
      ];
      expect(callback).to.be.a('function');
    });

    it('dispatches renameLoadedFavorite via the bound store', async function () {
      const fav = { _id: 'fav-1', _name: 'Active customers', filter: { x: 1 } };
      const updateAttributesStub = sinon.stub().resolves();
      const { store, localAppRegistry } = await setupBridge({
        favorites: [fav],
        updateAttributesStub,
      });

      // Load the favorite so renameLoadedFavorite has something to
      // operate on.
      store.dispatch(
        applyFromHistory({ filter: { x: 1 } }, [], { favoriteId: 'fav-1' })
      );

      const rename = (
        localAppRegistry as unknown as Record<
          string,
          RenameLoadedFavorite | undefined
        >
      )[LOADED_FAVORITE_RENAME_KEY];
      expect(rename).to.be.a('function');
      const ok = await rename!('Renamed customers');
      expect(ok).to.equal(true);
      expect(updateAttributesStub.callCount).to.equal(1);
      const [id, patch] = updateAttributesStub.firstCall.args;
      expect(id).to.equal('fav-1');
      expect(patch._name).to.equal('Renamed customers');
    });

    it('refuses empty / whitespace names', async function () {
      const fav = { _id: 'fav-1', _name: 'Active customers', filter: { x: 1 } };
      const updateAttributesStub = sinon.stub().resolves();
      const { store, localAppRegistry } = await setupBridge({
        favorites: [fav],
        updateAttributesStub,
      });
      store.dispatch(
        applyFromHistory({ filter: { x: 1 } }, [], { favoriteId: 'fav-1' })
      );
      const rename = (
        localAppRegistry as unknown as Record<
          string,
          RenameLoadedFavorite | undefined
        >
      )[LOADED_FAVORITE_RENAME_KEY];
      expect(await rename!('   ')).to.equal(false);
      expect(updateAttributesStub.callCount).to.equal(0);
    });
  });

  it('flips isDirty when the form fields diverge from the saved body', async function () {
    const fav = { _id: 'fav-1', _name: 'Active customers', filter: { x: 1 } };
    const { store, localAppRegistry } = await setupBridge({
      favorites: [fav],
    });
    // Load the favorite — clean.
    store.dispatch(
      applyFromHistory({ filter: { x: 1 } }, [], { favoriteId: 'fav-1' })
    );
    await waitFor(() => {
      const sticky = (
        localAppRegistry as unknown as Record<string, LoadedFavoritePayload>
      )[LOADED_FAVORITE_STICKY_KEY];
      expect(sticky?.isDirty).to.equal(false);
    });

    const heard: LoadedFavoritePayload[] = [];
    localAppRegistry.on(LOADED_FAVORITE_EVENT, (p: LoadedFavoritePayload) =>
      heard.push(p)
    );

    // Now edit the filter — load a different shape via applyFromHistory
    // (mirrors the user typing in the filter box from the bridge's
    // perspective; the reducer doesn't care which action shaped the
    // fields, only that they no longer match the saved body).
    store.dispatch(
      applyFromHistory({ filter: { x: 2 } }, [], { favoriteId: 'fav-1' })
    );

    await waitFor(() => {
      expect(heard.some((p) => p.isDirty)).to.equal(true);
    });
    expect(heard[heard.length - 1].name).to.equal('Active customers');
  });
});
