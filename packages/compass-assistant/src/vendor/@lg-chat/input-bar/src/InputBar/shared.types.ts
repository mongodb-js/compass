import { ReactNode } from 'react';

export const State = {
  Unset: 'unset',
  Error: 'error',
  Loading: 'loading',
} as const;
export type State = typeof State[keyof typeof State];

export interface SharedInputBarProps {
  /**
   * Custom error message to display when `state='error'`
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="compact"`.
   */
  errorMessage?: ReactNode;

  /**
   * The current state of the InputBar. This can be `'unset'`, `'error'`, or `'loading'`
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="compact"`.
   */
  state?: State;
}
