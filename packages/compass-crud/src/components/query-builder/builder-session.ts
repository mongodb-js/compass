import type { BuilderState } from './builder-query';

export const MIN_BUILDER_WIDTH = 280;
export const MAX_BUILDER_WIDTH = 900;

/**
 * Mirrors a builder width within its own range.
 *
 * The resize handle sits on the right edge of the results pane and grows its
 * value as the pointer moves right. The builder is on the other side of the
 * handle, so its width has to move the opposite way. Mirroring the value into
 * the same range lets the handle clamp meaningfully in its own direction.
 *
 * Inverting the delta after the fact does not work: the handle clamps to the
 * range before handing the value over, so at either end the delta collapsed to
 * zero and the panel could not be dragged back, which is what made it stick.
 *
 * The function is its own inverse, so it converts in both directions.
 */
export function mirrorBuilderWidth(width: number): number {
  return MIN_BUILDER_WIDTH + MAX_BUILDER_WIDTH - width;
}

/**
 * Builder rows, kept per collection for the life of the session.
 *
 * Switching collections unmounts the tab and coming back mounts a new one, so
 * anything held in component state is lost. Keying by namespace means each
 * collection keeps its own query rather than sharing one set or starting over.
 */
const builderStateByNamespace = new Map<string, BuilderState>();

export function loadBuilderState(namespace: string): BuilderState | undefined {
  return builderStateByNamespace.get(namespace);
}

export function saveBuilderState(namespace: string, state: BuilderState): void {
  builderStateByNamespace.set(namespace, state);
}

/** Exported for tests, which need to start from a known state. */
export function clearAllBuilderState(): void {
  builderStateByNamespace.clear();
}
