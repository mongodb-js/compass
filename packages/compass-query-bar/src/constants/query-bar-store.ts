const USER_TYPING_DEBOUNCE_MS = 100;

const RESET_STATE = 'reset';
const APPLY_STATE = 'apply';

const DEFAULT_FILTER = {};
const DEFAULT_PROJECT = null;
const DEFAULT_SORT = null;
const DEFAULT_COLLATION = null;
const DEFAULT_SKIP = 0;
const DEFAULT_LIMIT = 0;

const DEFAULT_MAX_TIME_MS = 60_000;
const DEFAULT_STATE = RESET_STATE;

const DEFAULT_FIELD_VALUES = {
  filter: undefined,
  project: undefined,
  collation: undefined,
  sort: undefined,
  skip: undefined,
  limit: undefined,
  maxTimeMS: undefined,
} as const;

export {
  USER_TYPING_DEBOUNCE_MS,
  RESET_STATE,
  APPLY_STATE,
  DEFAULT_FILTER,
  DEFAULT_PROJECT,
  DEFAULT_SORT,
  DEFAULT_COLLATION,
  DEFAULT_SKIP,
  DEFAULT_LIMIT,
  DEFAULT_MAX_TIME_MS,
  DEFAULT_STATE,
  DEFAULT_FIELD_VALUES,
};
