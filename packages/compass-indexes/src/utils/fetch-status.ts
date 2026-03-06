export const FetchStatuses = {
  /**
   * We do not have a list yet.
   */
  NOT_READY: 'NOT_READY',
  /**
   * We have a list of indexes.
   */
  READY: 'READY',
  /**
   * We are fetching the list for first time.
   */
  FETCHING: 'FETCHING',
  /**
   * We are refreshing the list.
   */
  REFRESHING: 'REFRESHING',
  /**
   * We are polling the list.
   */
  POLLING: 'POLLING',
  /**
   * Loading the list failed.
   */
  ERROR: 'ERROR',
} as const;

export type FetchStatus = (typeof FetchStatuses)[keyof typeof FetchStatuses];

// Any the status which means we're busy fetching the list one way or another
export type FetchingStatus = 'REFRESHING' | 'POLLING' | 'FETCHING';

// List of fetch statuses when the server should not be called to avoid multiple
// requests.
export const NOT_FETCHABLE_STATUSES: FetchStatus[] = [
  'FETCHING',
  'POLLING',
  'REFRESHING',
];

/**
 * Returns true if the status indicates we have a ready list of indexes
 * (including when we're polling/refreshing an existing list).
 */
export function isReadyStatus(status: FetchStatus): boolean {
  return (
    status === FetchStatuses.READY ||
    status === FetchStatuses.REFRESHING ||
    status === FetchStatuses.POLLING
  );
}
