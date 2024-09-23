export enum FetchReasons {
  /**
   *
   */
  INITIAL_FETCH = 'INITIAL_FETCH',
  /**
   *
   */
  REFRESH = 'REFRESH',
  /**
   *
   */
  POLL = 'POLL',
}

export type FetchReason = keyof typeof FetchReasons;
