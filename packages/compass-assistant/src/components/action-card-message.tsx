import React from 'react';
import {
  css,
  cx,
  Icon,
  LgChatMessage,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { ToolState } from '../utils';

const { Message } = LgChatMessage;

type ActionCardChip = NonNullable<
  React.ComponentProps<typeof Message.ActionCard>['chips']
>[number];

export interface ActionCardButton {
  label: string;
  variant: 'default' | 'primary';
  onClick: () => void;
  isPrimary?: boolean;
}

interface ActionCardMessageProps {
  state: ToolState;
  title: React.ReactNode;
  chips?: ActionCardChip[];
  initialIsExpanded?: boolean;
  contentClassName?: string;
  showActions?: boolean;
  focusPrimaryKey?: string;
  buttons?: ActionCardButton[];
  // `Message.ActionCard.ExpandableContent` renders markdown from a string, so
  // children must be a string (not a general ReactNode).
  children: string;
}

const actionCardMessageStyles = css({
  paddingTop: spacing[400],
});

const expandableContentStyles = css({
  pre: {
    maxHeight: '200px',
    overflow: 'auto',
  },
});
const expandableContentStylesLight = css({
  color: palette.gray.dark1,
});
const expandableContentStylesDark = css({
  color: palette.gray.light1,
});

const primaryButtonStyle = css({
  flex: 'unset',
  marginLeft: 'auto',
  marginRight: '0',
});

const secondaryButtonStyle = css({
  flex: 'unset',
  marginLeft: '0',
  marginRight: 'auto',
});

export const ActionCardMessage: React.FunctionComponent<
  ActionCardMessageProps
> = ({
  state,
  title,
  chips = [],
  initialIsExpanded = true,
  contentClassName,
  showActions = false,
  focusPrimaryKey,
  buttons = [],
  children,
}) => {
  const darkMode = useDarkMode();
  const primaryButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (showActions && primaryButtonRef.current) {
      primaryButtonRef.current.focus();
    }
  }, [showActions, focusPrimaryKey]);

  return (
    <div className={actionCardMessageStyles}>
      <Message.ActionCard
        initialIsExpanded={initialIsExpanded}
        showExpandButton={true}
        state={state}
        title={title}
        darkMode={darkMode}
        chips={chips}
      >
        <Message.ActionCard.ExpandableContent
          className={cx(
            expandableContentStyles,
            darkMode
              ? expandableContentStylesDark
              : expandableContentStylesLight,
            contentClassName
          )}
        >
          {children}
        </Message.ActionCard.ExpandableContent>
        {showActions &&
          buttons.map((button) => (
            <Message.ActionCard.Button
              className={
                button.isPrimary ? primaryButtonStyle : secondaryButtonStyle
              }
              key={button.label}
              onClick={button.onClick}
              variant={button.variant}
              rightGlyph={
                button.isPrimary ? <Icon glyph="Return" /> : undefined
              }
              ref={button.isPrimary ? primaryButtonRef : undefined}
            >
              {button.label}
            </Message.ActionCard.Button>
          ))}
      </Message.ActionCard>
    </div>
  );
};
