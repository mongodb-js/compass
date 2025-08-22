import React from 'react';

import { BaseInputOptionProps } from '@mongodb-js/compass-components';
import { DarkModeProps } from '@mongodb-js/compass-components';

export type SuggestedPromptProps = DarkModeProps &
  Omit<BaseInputOptionProps, 'showWedge' | 'active' | 'isInteractive'> & {
    /**
     * The value of the result
     */
    children: React.ReactNode;

    /**
     * Callback fired when the option is clicked
     */
    onClick?: React.MouseEventHandler;
  };
