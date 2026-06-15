export const STARTED = 'STARTED' as const;
const CANCELED = 'CANCELED' as const;
const COMPLETED = 'COMPLETED' as const;
const COMPLETED_WITH_ERRORS = 'COMPLETED_WITH_ERRORS' as const;
const FAILED = 'FAILED' as const;
const UNSPECIFIED = 'UNSPECIFIED' as const;

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
const PROCESS_STATUS = {
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

const COMPLETED_STATUSES: ProcessStatus[] = [COMPLETED, COMPLETED_WITH_ERRORS];

export default PROCESS_STATUS;
