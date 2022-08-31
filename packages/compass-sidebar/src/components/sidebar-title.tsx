import React, { useCallback, useMemo } from 'react';

import {
  MongoDBLogoMark,
  css,
  cx,
  uiColors,
  spacing,
  ItemActionControls,
  useTheme,
  Theme,
} from '@mongodb-js/compass-components';

import type { ItemAction } from '@mongodb-js/compass-components';

type Actions =
  | 'open-instance-workspace'
  | 'copy-connection-string'
  | 'edit-favorite'
  | 'open-connection-info';

const titleLabel = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontSize: '18px', // TODO: what's the right way to do this?
  fontWeight: 600, // TODO: 500 once we have the new font
  marginLeft: '2px', // TODO: hardcoded to try and match the design
  paddingRight: spacing[2],
});

const TitleLabel: React.FunctionComponent<React.HTMLProps<HTMLSpanElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span className={cx(titleLabel, className)} {...props}>
      {children}
    </span>
  );
};

const titleLogo = css({
  width: spacing[5],
  paddingLeft: spacing[1],
  marginTop: '6px', // TODO: hardcoded to try and match the design
  flexShrink: 0,
});

function TitleLogo() {
  const { theme } = useTheme();

  return (
    <div className={titleLogo}>
      <MongoDBLogoMark
        color={theme === Theme.Dark ? 'green-dark-2' : 'green-base'}
        height={32}
      />
    </div>
  );
}

const sidebarTitle = css({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  color: 'var(--title-color)',
  backgroundColor: 'var(--title-bg-color)',

  height: spacing[6] + spacing[1], // TODO: 66px is kinda non-standard. Check with Claudia.
  padding: spacing[3],
});

const iconButtonDark = css({
  color: uiColors.gray.dark3,
  '&:hover,&:focus,&:active': {
    color: uiColors.white,
  },
});

const iconButtonLight = css({
  color: uiColors.white,
  '&:hover': {
    color: uiColors.gray.dark3,
  },
});

const iconButtonStyle = css({
  color: 'inherit',
});

function SidebarTitle({
  title,
  isFavorite,
  onAction,
  isExpanded = false,
}: {
  title: string;
  isFavorite: boolean;
  isExpanded?: boolean;
  onAction(actionName: Actions, ...rest: any[]): void;
}) {
  const actions = useMemo(() => {
    const actions: ItemAction<Actions>[] = [];

    actions.push({
      action: 'copy-connection-string',
      label: 'Copy connection string',
      icon: 'Copy',
    });

    actions.push({
      action: 'edit-favorite',
      label: isFavorite ? 'Edit favorite' : 'Save favorite',
      icon: 'Favorite',
    });

    actions.push({
      action: 'open-connection-info',
      label: 'Connection info',
      icon: 'Connect',
    });

    return actions;
  }, [isFavorite]);

  const { theme } = useTheme();

  const onClick = useCallback(() => {
    onAction('open-instance-workspace', 'My Queries');
  }, [onAction]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className={cx(sidebarTitle)} onClick={onClick}>
      <TitleLogo />
      {isExpanded && <TitleLabel title={title}>{title}</TitleLabel>}
      {isExpanded && (
        <ItemActionControls<Actions>
          onAction={onAction}
          iconSize="small"
          actions={actions}
          data-testid="sidebar-title-actions"
          iconClassName={cx(
            iconButtonStyle,
            theme === Theme.Dark ? iconButtonDark : iconButtonLight
          )}
        ></ItemActionControls>
      )}
    </div>
  );
}

export default SidebarTitle;
