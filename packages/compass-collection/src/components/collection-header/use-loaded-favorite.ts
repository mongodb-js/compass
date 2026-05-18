import { useEffect, useState } from 'react';
import { useLocalAppRegistry } from '@mongodb-js/compass-app-registry';

/**
 * Pub/sub contract with `@mongodb-js/compass-query-bar`'s loaded-favorite
 * bridge. The query-bar's store broadcasts the current loaded-favorite
 * identity on every relevant state change; this hook subscribes and
 * returns the latest payload plus the rename callback bound to that
 * store.
 *
 * Symbols are duplicated verbatim from
 * `compass-query-bar/src/loaded-favorite-bridge.ts`. We don't import
 * from that package because compass-query-bar already depends on
 * compass-collection — making the dep go the other way would create a
 * cycle. Three small string constants is a fair price for the looser
 * coupling.
 */
const LOADED_FAVORITE_EVENT = 'query-bar:loaded-favorite-changed';
const LOADED_FAVORITE_STICKY_KEY = '_compassQueryBarLoadedFavorite';
const LOADED_FAVORITE_RENAME_KEY = '_compassQueryBarRenameLoadedFavorite';

type RenameLoadedFavorite = (newName: string) => Promise<boolean>;

export type LoadedFavoriteInfo = {
  name: string | null;
  isDirty: boolean;
  /**
   * Rename callback bound to the query-bar's dispatch. `null` when no
   * producer has wired up yet (e.g. in storybook / test stubs without
   * the QueryBarPlugin). Resolves `true` on success.
   */
  rename: RenameLoadedFavorite | null;
};

const EMPTY: Omit<LoadedFavoriteInfo, 'rename'> = {
  name: null,
  isDirty: false,
};

function readSticky(
  registry: unknown
): Omit<LoadedFavoriteInfo, 'rename'> | undefined {
  return (registry as Record<string, Omit<LoadedFavoriteInfo, 'rename'>>)[
    LOADED_FAVORITE_STICKY_KEY
  ];
}

function readRename(registry: unknown): RenameLoadedFavorite | null {
  const fn = (registry as Record<string, unknown>)[LOADED_FAVORITE_RENAME_KEY];
  return typeof fn === 'function' ? (fn as RenameLoadedFavorite) : null;
}

/**
 * Returns the current loaded-favorite info for this collection-tab,
 * or `{ name: null, isDirty: false, rename: null }` when no favorite
 * is loaded / no producer has wired up.
 *
 * Re-renders the caller whenever the name or dirty flag flips. Doesn't
 * re-render on every filter keystroke — the producer dedupes at the
 * source.
 *
 * Reads the *current* value synchronously on mount (from the sticky
 * field on the registry) so the breadcrumb doesn't flicker through an
 * empty state on first paint when the query-bar plugin activated
 * before this component mounted.
 */
export function useLoadedFavorite(): LoadedFavoriteInfo {
  const localAppRegistry = useLocalAppRegistry();
  const [info, setInfo] = useState<Omit<LoadedFavoriteInfo, 'rename'>>(() => {
    return readSticky(localAppRegistry) ?? EMPTY;
  });

  useEffect(() => {
    const handler = (payload: Omit<LoadedFavoriteInfo, 'rename'>) =>
      setInfo(payload);
    localAppRegistry.on(LOADED_FAVORITE_EVENT, handler);
    // Sync once after subscribing in case the value flipped between
    // the initial useState seed and this effect attaching.
    const latest = readSticky(localAppRegistry);
    if (latest) setInfo(latest);
    return () => {
      localAppRegistry.removeListener(LOADED_FAVORITE_EVENT, handler);
    };
  }, [localAppRegistry]);

  // Pull the rename callback every render — the producer writes it
  // once at activate time, so this is effectively constant for the
  // lifetime of the plugin, but reading it on each render means we
  // get the up-to-date function reference if a different plugin
  // instance ever takes over the same registry (e.g. across HMR).
  return { ...info, rename: readRename(localAppRegistry) };
}
