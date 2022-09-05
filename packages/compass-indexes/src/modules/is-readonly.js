/**
 * The initial state of the is readonly attribute.
 */
export const INITIAL_STATE =
  process.env.HADRON_READONLY === 'true' ? true : false;

/**
 * Reducer function doesn't do anything since we're based on process.
 */
export default function reducer(state = INITIAL_STATE) {
  return state;
}
