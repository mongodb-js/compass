export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  includeKeys: readonly K[]
): Pick<T, K> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => includeKeys.includes(key as K))
  ) as Pick<T, K>;
}
