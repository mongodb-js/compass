const ControllerMap = new Map<number, AbortController>();

let attemptId = 0;

export function getAbortSignal(id?: number) {
  if (typeof id !== 'undefined') {
    return { id, signal: ControllerMap.get(id)?.signal };
  }
  id = ++attemptId;
  const controller = new AbortController();
  ControllerMap.set(id, controller);
  return { id, signal: controller.signal };
}

export function abort(id: number) {
  ControllerMap.get(id)?.abort();
  ControllerMap.delete(id);
}
