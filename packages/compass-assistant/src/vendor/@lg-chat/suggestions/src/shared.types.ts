/**
 * Options to control the state of the SuggestedActions
 */
export const State = {
  Unset: 'unset',
  Apply: 'apply',
  Success: 'success',
  Error: 'error',
} as const;
export type State = typeof State[keyof typeof State];

/**
 * A single configuration parameter with its key, value, and current state
 */
export interface ConfigurationParameter {
  key: string;
  value: string;
  state?: State; // Defaults to 'unset' if not specified
}

/**
 * Array of configuration parameters, each with their own state.
 */
export type ConfigurationParameters = Array<ConfigurationParameter>;
