import { ReactNode } from 'react';

import { HTMLElementProps } from '@mongodb-js/compass-components';

export interface SuggestedPromptsProps extends HTMLElementProps<'div'> {
  /**
   * Title for the group of options
   */
  label: string;

  /**
   * Must be <SuggestedPrompt /> or <SuggestedPrompts />
   */
  children: ReactNode;
}
