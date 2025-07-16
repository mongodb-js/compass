import { ComponentPropsWithRef } from 'react';

import { DarkModeProps, LgIdProps } from '@leafygreen-ui/lib';
export interface ToolbarProps
  extends ComponentPropsWithRef<'div'>,
    DarkModeProps,
    LgIdProps {
  children: React.ReactNode;
}
