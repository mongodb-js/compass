import {
  DarkModeProps,
  HTMLElementProps,
} from '@mongodb-js/compass-components';

import { SharedInputBarProps } from './shared.types';

export interface InputBarFeedbackProps
  extends DarkModeProps,
    HTMLElementProps<'div'>,
    SharedInputBarProps {}
