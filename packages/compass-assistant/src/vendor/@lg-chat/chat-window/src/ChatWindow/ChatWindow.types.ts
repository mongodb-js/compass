import { TitleBarProps } from '@lg-chat/title-bar';

import { shim_lib } from '@mongodb-js/compass-components';

export interface ChatWindowProps
  extends Omit<shim_lib.HTMLElementProps<'div'>, 'title'>,
    shim_lib.DarkModeProps,
    TitleBarProps {}
