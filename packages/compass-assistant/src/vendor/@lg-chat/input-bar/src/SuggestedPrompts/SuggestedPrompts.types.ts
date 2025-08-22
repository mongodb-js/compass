import { ReactNode } from 'react';

import { shim_lib } from '@mongodb-js/compass-components';

export interface SuggestedPromptsProps
  extends shim_lib.HTMLElementProps<'div'> {
  /**
   * Title for the group of options
   */
  label: string;

  /**
   * Must be <SuggestedPrompt /> or <SuggestedPrompts />
   */
  children: ReactNode;
}
