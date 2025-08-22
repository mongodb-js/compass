import { PropsWithChildren } from 'react';

import {
  DarkModeProps,
  HTMLElementProps,
} from '@mongodb-js/compass-components';

export type MessagePromptsProps = HTMLElementProps<'div'> &
  DarkModeProps &
  PropsWithChildren<{
    label?: string;
  }>;
