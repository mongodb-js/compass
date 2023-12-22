import React, { useCallback, useMemo } from 'react';

import {
  MongoDBLogoMark,
  css,
  cx,
  palette,
  spacing,
  ItemActionControls,
  useDarkMode,
  useDefaultAction,
} from '@mongodb-js/compass-components';

import type { ItemAction } from '@mongodb-js/compass-components';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import FavoriteIndicator from './favorite-indicator';

type Action =
  | 'copy-connection-string'
  | 'edit-favorite'
  | 'open-connection-info'
  | 'expand-sidebar'
  | 'refresh-data'
  | 'open-compass-settings';

const titleLabel = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontSize: '18px',
  fontWeight: 600, // TODO: 500 once we have the new font
  marginLeft: '2px', // hardcoded to try and match the design
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
  marginTop: '6px', // hardcoded to try and match the design
  flexShrink: 0,
});

function TitleLogo() {
  const darkMode = useDarkMode();

  return (
    <div className={titleLogo}>
      <MongoDBLogoMark
        color={darkMode ? 'green-dark-2' : 'green-base'}
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

  height: spacing[6],
  padding: spacing[3],
});

const iconButtonDark = css({
  color: palette.gray.dark3,
  '&:hover': {
    color: palette.white,
  },
});

const iconButtonLight = css({
  color: palette.white,
  '&:hover': {
    color: palette.gray.dark3,
  },
});

const iconButtonStyle = css({
  color: 'inherit',
});

function SidebarTitle({
  title,
  isFavorite,
  favoriteColor,
  onAction,
  isExpanded = false,
}: {
  title: string;
  isFavorite: boolean;
  favoriteColor?: string;
  isExpanded?: boolean;
  onAction(actionName: Action, ...rest: any[]): void;
}) {
  const { openMyQueriesWorkspace } = useOpenWorkspace();

  const actions = useMemo(() => {
    const actions: ItemAction<Action>[] = [];

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

    actions.push({
      action: 'open-compass-settings',
      label: 'Compass Settings',
      icon: 'Settings',
    });

    return actions;
  }, [isFavorite]);

  const darkMode = useDarkMode();

  const onClick = useCallback(() => {
    if (isExpanded) {
      openMyQueriesWorkspace();
    } else {
      onAction('expand-sidebar');
    }
  }, [isExpanded, onAction, openMyQueriesWorkspace]);

  const defaultActionProps = useDefaultAction(onClick);

  return (
    <>
      <div
        className={cx(sidebarTitle)}
        data-testid="sidebar-title"
        {...defaultActionProps}
      >
        <TitleLogo />
        {isExpanded && <TitleLabel title={title}>{title}</TitleLabel>}
        {isExpanded && (
          <ItemActionControls<Action>
            onAction={onAction}
            iconSize="small"
            actions={actions}
            data-testid="sidebar-title-actions"
            iconClassName={cx(
              iconButtonStyle,
              darkMode ? iconButtonDark : iconButtonLight
            )}
          ></ItemActionControls>
        )}
      </div>
      {isFavorite && favoriteColor && (
        <FavoriteIndicator favoriteColor={favoriteColor}></FavoriteIndicator>
      )}
    </>
  );
}

export default SidebarTitle;
