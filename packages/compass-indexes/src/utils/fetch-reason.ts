export const FetchReasons = {
  INITIAL_FETCH: 'INITIAL_FETCH',
  REFRESH: 'REFRESH',
  POLL: 'POLL',
} as const;

export type FetchReason = (typeof FetchReasons)[keyof typeof FetchReasons];
