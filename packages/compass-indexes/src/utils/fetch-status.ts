export enum FetchStatuses {
  /**
   * No support. Default status.
   */
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  /**
   * We do not have a list yet.
   */
  NOT_READY = 'NOT_READY',
  /**
   * We have a list of indexes.
   */
  READY = 'READY',
  /**
   * We are fetching the list for first time.
   */
  FETCHING = 'FETCHING',
  /**
   * We are refreshing the list.
   */
  REFRESHING = 'REFRESHING',
  /**
   * We are polling the list.
   */
  POLLING = 'POLLING',
  /**
   * Loading the list failed.
   */
  ERROR = 'ERROR',
}

export type FetchStatus = keyof typeof FetchStatuses;

// Any the status which means we're busy fetching the list one way or another
export type FetchingStatus = 'REFRESHING' | 'POLLING' | 'FETCHING';

// List of fetch statuses when the server should not be called to avoid multiple
// requests.
export const NOT_FETCHABLE_STATUSES: FetchStatus[] = [
  'NOT_AVAILABLE',
  'FETCHING',
  'POLLING',
  'REFRESHING',
];
