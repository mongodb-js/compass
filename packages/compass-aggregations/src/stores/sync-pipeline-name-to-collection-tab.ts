import type { Store } from 'redux';
import type { RootState } from '../modules';

const EVENT = 'compass-collection-aggregations-pipeline-name';

type AppRegistryWithEmit = {
  emit(eventName: string, ...args: unknown[]): boolean;
};

/**
 * Syncs pipeline display name (next to Save) into the collection tab tooltip state.
 */
export function subscribePipelineNameToCollectionTab(
  store: Store<RootState>,
  localAppRegistry: AppRegistryWithEmit
): () => void {
  let previous = store.getState().name;
  const emit = (): void => {
    const name = store.getState().name;
    if (name === previous) {
      return;
    }
    previous = name;
    localAppRegistry.emit(EVENT, name.trim());
  };

  emit();
  return store.subscribe(emit);
}
