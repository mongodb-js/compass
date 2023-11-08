/**
 * The reset action name.
 */
export const RESET = 'sidebar/reset' as const;
export type ResetAction = { type: typeof RESET };

/**
 * Reset the state action.
 *
 * @return {Object} The action creator.
 */
export const reset = (): ResetAction => ({
  type: RESET,
});
