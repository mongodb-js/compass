/**
 * Helper method to do something after skipping a few frames. Useful when
 * something needs to happen after browser handled layout related operations,
 * like focusing an element or repainting
 *
 * Scheduling one rAF inside another rAF ensures that we will wait until next
 * frame, see https://medium.com/@paul_irish/requestanimationframe-scheduling-for-nerds-9c57f7438ef4
 *
 * Returns a function to abort fn
 */
export function rafraf(fn: FrameRequestCallback): () => void {
  const controller = new AbortController();
  requestAnimationFrame(() => {
    requestAnimationFrame((time) => {
      if (controller.signal.aborted) return;
      fn(time);
    });
  });
  return () => {
    controller.abort();
  };
}
