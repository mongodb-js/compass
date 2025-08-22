import {
  DarkModeProps,
  HTMLElementProps,
} from '@mongodb-js/compass-components';

import { ConfigurationParameters, State } from '../shared.types';

export interface SuggestedActionsProps
  extends HTMLElementProps<'div'>,
    DarkModeProps {
  /**
   * Configuration parameters with their individual state values.
   * Each parameter includes a key, value, and state (unset/apply/success/error).
   */
  configurationParameters: ConfigurationParameters;

  /**
   * Callback fired when the user clicks the "Apply" button
   */
  onClickApply: () => void;

  /**
   * Determines rendering of the SuggestedActions:
   * - `'Unset'` will render suggestions
   * - `'Apply'` will render suggestions and the "Apply" button
   * - `'Success'` will render success banner with applied suggestions
   * - `'Error'` will render error banner with instructions to manually apply suggestions
   */
  state: State;
}
