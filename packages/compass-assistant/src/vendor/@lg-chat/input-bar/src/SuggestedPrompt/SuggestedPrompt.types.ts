import React from 'react';

import { shim_lib, shim_input_option } from '@mongodb-js/compass-components';

export type SuggestedPromptProps = shim_lib.DarkModeProps &
  Omit<
    shim_input_option.BaseInputOptionProps,
    'showWedge' | 'active' | 'isInteractive'
  > & {
    /**
     * The value of the result
     */
    children: React.ReactNode;

    /**
     * Callback fired when the option is clicked
     */
    onClick?: React.MouseEventHandler;
  };
