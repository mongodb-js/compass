/**
 * Messages between the renderer's shell runtime and the embedded-shell
 * utility that are about the worker itself rather than for it. Everything
 * else on the port is the shell runtime's own RPC traffic, forwarded to and
 * from the worker untouched.
 */
export type ShellMetaRequest =
  /** Start the worker. The renderer then talks to it with the runtime's RPC. */
  | { meta: 'spawn'; workerOptions: { name?: string } }
  /** Interrupt the running evaluation from outside the worker thread. */
  | { meta: 'interrupt' }
  | { meta: 'terminate' };

export type ShellMetaEvent =
  /** The worker failed to start or threw outside an RPC call. */
  | { meta: 'error'; error: Error }
  /** Reply to `interrupt`: false when nothing interruptible was running. */
  | { meta: 'interrupted'; interrupted: boolean };

export function isShellMeta(
  data: unknown
): data is ShellMetaRequest | ShellMetaEvent {
  return typeof data === 'object' && data !== null && 'meta' in data;
}
