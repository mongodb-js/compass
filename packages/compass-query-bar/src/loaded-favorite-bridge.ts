/**
 * Pub/sub contract that lets surfaces *outside* the query-bar package
 * (e.g. the collection-header breadcrumb) learn which saved favorite,
 * if any, the user has loaded into the query bar — without those
 * surfaces having to import from `@mongodb-js/compass-query-bar`
 * (which would be a circular dep, since compass-query-bar already
 * depends on compass-collection).
 *
 * Producer side: the query-bar store subscribes to its own state and
 * emits on `localAppRegistry` whenever the loaded-favorite identity or
 * dirty state changes. The latest value is also stashed on the
 * appRegistry instance under {@link LOADED_FAVORITE_STICKY_KEY} so a
 * consumer that mounts *after* the producer can read the current state
 * synchronously without waiting for the next change.
 *
 * Consumer side: anything that calls `useLocalAppRegistry()` can:
 *   1. Read `(reg as any)[LOADED_FAVORITE_STICKY_KEY]` for the current
 *      value (or `undefined` if no favorite is loaded).
 *   2. Subscribe via `reg.on(LOADED_FAVORITE_EVENT, listener)` for
 *      updates.
 *
 * The producer is responsible for clearing the sticky value on plugin
 * deactivation so a stale name doesn't leak across tab tear-downs.
 *
 * NOTE: keep the symbol names in sync with `compass-collection`'s
 * subscriber. There is no shared package between the two, so this
 * file's exported strings are the source of truth — duplicate them
 * verbatim on the consumer side.
 */

/** Name of the event emitted on the localAppRegistry. */
export const LOADED_FAVORITE_EVENT = 'query-bar:loaded-favorite-changed';

/**
 * Key under which the producer stashes the latest payload on the
 * `localAppRegistry` instance. Underscore-prefixed because it's an
 * implementation detail, not part of the AppRegistry public API.
 */
export const LOADED_FAVORITE_STICKY_KEY =
  '_compassQueryBarLoadedFavorite' as const;

/**
 * Key under which the producer stashes a *rename* callback bound to
 * its own dispatch. Consumers (e.g. the breadcrumb chip) can call
 * this to commit an inline rename without taking a direct dependency
 * on the query-bar package — keeps the package boundary intact.
 */
export const LOADED_FAVORITE_RENAME_KEY =
  '_compassQueryBarRenameLoadedFavorite' as const;

export type LoadedFavoritePayload = {
  /** Display name of the loaded favorite. `null` when none is loaded. */
  name: string | null;
  /** True iff the current draft query diverges from the saved body. */
  isDirty: boolean;
};

/**
 * Callback shape stashed under {@link LOADED_FAVORITE_RENAME_KEY}.
 * Resolves to `true` on success, `false` on validation failure or
 * when no favorite is loaded.
 */
export type RenameLoadedFavorite = (newName: string) => Promise<boolean>;
