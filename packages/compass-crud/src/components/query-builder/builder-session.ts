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
 * What the panel looked like for a collection, kept for the life of the
 * session: its rows, whether it was open, and how wide it was.
 *
 * Switching collections unmounts the view and coming back mounts a new one, so
 * anything held in component state is lost. Keying by namespace means each
 * collection keeps its own query and its own panel, rather than sharing one or
 * starting over. A collection that has never been opened has no entry, which is
 * what keeps the panel collapsed until it is asked for the first time.
 */
export type BuilderSession = {
  state: BuilderState;
  isExpanded: boolean;
  width: number;
};

const sessionsByNamespace = new Map<string, BuilderSession>();

export function loadBuilderSession(
  namespace: string
): BuilderSession | undefined {
  return sessionsByNamespace.get(namespace);
}

export function saveBuilderSession(
  namespace: string,
  session: BuilderSession
): void {
  sessionsByNamespace.set(namespace, session);
}

/** Exported for tests, which need to start from a known state. */
export function clearAllBuilderState(): void {
  sessionsByNamespace.clear();
}
