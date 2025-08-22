import { TitleBarProps } from '@lg-chat/title-bar';

import {
  DarkModeProps,
  HTMLElementProps,
} from '@mongodb-js/compass-components';

export interface ChatWindowProps
  extends Omit<HTMLElementProps<'div'>, 'title'>,
    DarkModeProps,
    TitleBarProps {}
