/**
 * Everything about a utility process follows from its name rather than sharing constants.
 */

/** File main forks; webpack builds `<name>/index.mts` to it. */
export function utilityFileName(name: string): string {
  return `${name}.mjs`;
}

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
