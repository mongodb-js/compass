import { PropsWithChildren } from 'react';

import { shim_lib } from '@mongodb-js/compass-components';

export type MessagePromptsProps = shim_lib.HTMLElementProps<'div'> &
  shim_lib.DarkModeProps &
  PropsWithChildren<{
    label?: string;
  }>;
