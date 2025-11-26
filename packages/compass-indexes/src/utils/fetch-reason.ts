// @ts-expect-error TODO(): replace enums with const kv objects
export enum FetchReasons {
  INITIAL_FETCH = 'INITIAL_FETCH',
  REFRESH = 'REFRESH',
  POLL = 'POLL',
}

export type FetchReason = keyof typeof FetchReasons;
