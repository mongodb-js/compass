import { PropsWithChildren, ReactNode } from 'react';
import { MouseEventHandler } from 'react';
import { ChatWindowProps } from '@lg-chat/chat-window';
import { TitleBarProps } from '@lg-chat/title-bar';

import { shim_lib } from '@mongodb-js/compass-components';
import { shim_popover } from '@mongodb-js/compass-components';

export type FixedChatWindowProps = shim_lib.DarkModeProps &
  ChatWindowProps &
  TitleBarProps &
  PropsWithChildren<{
    /**
     * Define whether the chat window should be open by default when uncontrolled
     */
    defaultOpen?: boolean;

    /**
     * Override the default ChatTrigger component
     */
    trigger?: ReactNode;

    /**
     * Text inside the ChatTrigger component if no custom trigger is used
     */
    triggerText: string;

    /**
     * Control the open state of the chat window. If no value is provided here, the component will function with default toggling behavior.
     */
    open?: boolean;

    /**
     * Event handler for the close button in the title bar. Only necessary when controlled.
     */
    onClose?: MouseEventHandler<HTMLButtonElement>;

    /**
     * Event handler for the chat trigger button. Only necessary when controlled.
     */
    onTriggerClick?: MouseEventHandler<HTMLButtonElement>;

    /**
     * Props passed to the ChatWindow Popover
     */
    popoverProps?: Omit<
      shim_popover.PopoverProps,
      'dismissMode' | 'onToggle' | 'renderMode'
    >;
  }>;
