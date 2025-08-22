import { MouseEventHandler, PropsWithChildren } from 'react';

import { type shim_lib } from '@mongodb-js/compass-components';

export type MessagePromptProps = shim_lib.HTMLElementProps<'button'> &
  shim_lib.DarkModeProps &
  PropsWithChildren<{
    /**
     * Specifies that the MessagePrompt is selected. When one message prompt is selected, the others are disabled by default.
     */
    selected?: boolean;
    /**
     * Specifies that the MessagePrompt is disabled.
     */
    disabled?: boolean;
    /**
     * Event handler called onClick.
     */
    onClick?: MouseEventHandler<HTMLButtonElement>;
  }>;
