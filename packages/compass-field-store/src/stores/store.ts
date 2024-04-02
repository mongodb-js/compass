import { createStore } from 'redux';
import reducer from '../modules';
import type { ActivateHelpers } from 'hadron-app-registry';
import { FieldStoreContext } from './context';

export function activatePlugin(
  _initialProps: unknown,
  _: unknown,
  { cleanup }: ActivateHelpers
) {
  const store = createStore(reducer);

  return { store, deactivate: cleanup, context: FieldStoreContext };
}
