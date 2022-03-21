export const STARTED = 'STARTED';
export const CANCELED = 'CANCELED';
export const COMPLETED = 'COMPLETED';
export const COMPLETED_WITH_ERRORS = 'COMPLETED_WITH_ERRORS';
export const FAILED = 'FAILED';
export const UNSPECIFIED = 'UNSPECIFIED';

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
};

/**
 * The finished statuses.
 */
export const FINISHED_STATUSES = [
  CANCELED,
  COMPLETED,
  COMPLETED_WITH_ERRORS,
  FAILED,
];

export const COMPLETED_STATUSES = [COMPLETED, COMPLETED_WITH_ERRORS];

export default PROCESS_STATUS;
