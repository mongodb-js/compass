import toNS from 'mongodb-ns';
import type { RootAction } from '.';

type NS = ReturnType<typeof toNS>;

/**
 * Namespace changed action.
 */
export const NAMESPACE_CHANGED =
  'validation/namespace/NAMESPACE_CHANGED' as const;
interface NamespaceChangedAction {
  type: typeof NAMESPACE_CHANGED;
  namespace: NS;
}

export type NamespaceAction = NamespaceChangedAction;
export type NamespaceState = NS;

/**
 * The initial state.
 */
export const INITIAL_STATE: NS = toNS('');

/**
 * Reducer function for handle state changes to namespace.
 *
 * @param {String} state - The namespace state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state: NamespaceState = INITIAL_STATE,
  action: RootAction
): NamespaceState {
  if (action.type === NAMESPACE_CHANGED) {
    return action.namespace;
  }

  return state;
}

/**
 * Action creator for namespace changed events.
 *
 * @param {String} namespace - The namespace value.
 *
 * @returns {Object} The namespace changed action.
 */
export const namespaceChanged = (namespace: NS): NamespaceChangedAction => ({
  type: NAMESPACE_CHANGED,
  namespace,
});
