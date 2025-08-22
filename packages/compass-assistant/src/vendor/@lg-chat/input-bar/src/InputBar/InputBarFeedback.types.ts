import { shim_lib } from '@mongodb-js/compass-components';

import { SharedInputBarProps } from './shared.types';

export interface InputBarFeedbackProps
  extends shim_lib.DarkModeProps,
    shim_lib.HTMLElementProps<'div'>,
    SharedInputBarProps {}
