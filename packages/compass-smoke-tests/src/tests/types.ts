export const SUPPORTED_TESTS = [
  'time-to-first-query',
  'auto-update-from',
  'auto-update-to',
] as const;

export type TestName = typeof SUPPORTED_TESTS[number];
