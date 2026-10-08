/**
 * How renderer code reaches a utility process. Everything follows from the
 * utility's name, which is its directory under packages/compass/src/utilities.
 */

/**
 * Channel name the renderer posts its end of a MessageChannel on for the utility to pickup.
 */
export function utilityPortChannel(name: string): string {
  return `compass:utility:${name}:port`;
}

/** Whether `channel` is one `utilityPortChannel` produces, for any utility. */
export function isUtilityPortChannel(
  channel: unknown
): channel is `compass:utility:${string}:port` {
  return (
    typeof channel === 'string' && /^compass:utility:[^:]+:port$/.test(channel)
  );
}

/**
 * Opens a channel to the named utility. The preload script forwards the other
 * end to main, which hands it to the utility.
 */
export function openUtilityPort(name: string): MessagePort {
  const { port1, port2 } = new MessageChannel();
  window.postMessage({ type: utilityPortChannel(name) }, '*', [port2]);
  return port1;
}
