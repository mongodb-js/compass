import type { ComponentPropsWithRef } from 'react';

import type { DarkModeProps, LgIdProps } from '@leafygreen-ui/lib';
export interface ToolbarProps
  extends ComponentPropsWithRef<'div'>,
    DarkModeProps,
    LgIdProps {
  children: React.ReactNode;
}
