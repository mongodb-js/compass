/**
 * The reset action name.
 */
export const RESET = 'app/instance/reset' as const;
export type ResetAction = { type: typeof RESET };

/**
 * Reset the state action.
 *
 * @return {Object} The action creator.
 */
export const reset = (): ResetAction => ({
  type: RESET,
});
