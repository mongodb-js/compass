/**
 * Everything about a utility process follows from its name, which is its
 * directory under `src/utilities`. Main, preload and renderer derive what they
 * need from the name rather than sharing constants.
 */

/** File main forks; webpack builds `<name>/index.mts` to it. */
export function utilityFileName(name: string): string {
  return `${name}.mjs`;
}

/**
 * Channel a renderer posts its end of a MessageChannel on to reach the
 * utility, by way of preload and main. The `compass:utility:` prefix is not
 * used by any other channel.
 */
export function utilityPortChannel(name: string): string {
  return `compass:utility:${name}:port`;
}

/** Whether `channel` is one `utilityPortChannel` produces, for any utility. */
export function isUtilityPortChannel(channel: unknown): channel is string {
  return (
    typeof channel === 'string' && /^compass:utility:[^:]+:port$/.test(channel)
  );
}
