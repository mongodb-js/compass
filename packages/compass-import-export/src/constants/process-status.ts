export const STARTED = 'STARTED' as const;
export const CANCELED = 'CANCELED' as const;
export const COMPLETED = 'COMPLETED' as const;
export const COMPLETED_WITH_ERRORS = 'COMPLETED_WITH_ERRORS' as const;
export const FAILED = 'FAILED' as const;
export const UNSPECIFIED = 'UNSPECIFIED' as const;

export type ProcessStatus =
  | typeof STARTED
  | typeof CANCELED
  | typeof COMPLETED
  | typeof COMPLETED_WITH_ERRORS
  | typeof FAILED
  | typeof UNSPECIFIED;

/**
 * Process status constants.
 */
export const PROCESS_STATUS = {
  STARTED,
  CANCELED,
  COMPLETED,
  FAILED,
  UNSPECIFIED,
  COMPLETED_WITH_ERRORS,
} as const;

/**
 * The finished statuses.
 */
export const FINISHED_STATUSES: ProcessStatus[] = [
  CANCELED,
  COMPLETED,
  COMPLETED_WITH_ERRORS,
  FAILED,
];

export const COMPLETED_STATUSES: ProcessStatus[] = [
  COMPLETED,
  COMPLETED_WITH_ERRORS,
];

export default PROCESS_STATUS;
