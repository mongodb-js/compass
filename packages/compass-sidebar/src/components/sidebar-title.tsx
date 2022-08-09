import React, { useMemo } from 'react';

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
  | 'cluster-info';

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
      <MongoDBLogoMark color={theme === Theme.Dark ? 'green-dark-2' : 'green-base'} height={32} />
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

const sidebarTitleDark = css({
  '--icon-color': uiColors.gray.dark3,
  '--icon-color-hover': uiColors.black,
});

const sidebarTitleLight = css({
  '--icon-color': 'white',
  '--icon-color-hover': uiColors.black,
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
  onAction(actionName: Actions): void;
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
      action: 'cluster-info',
      label: 'Cluster info',
      icon: 'Connect',
    });

    return actions;
  }, [isFavorite]);

  const { theme } = useTheme();

  return (
    // TODO: https://jira.mongodb.org/browse/COMPASS-5918
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={cx(
        sidebarTitle,
        theme === Theme.Dark ? sidebarTitleDark : sidebarTitleLight
      )}
      onClick={() => onAction('open-instance-workspace')}
    >
      <TitleLogo />
      {isExpanded && <TitleLabel title={title}>{title}</TitleLabel>}
      {isExpanded && (
        <ItemActionControls<Actions>
          mode="normal"
          onAction={onAction}
          actions={actions}
          shouldCollapseActionsToMenu
          isActive={false}
          isHovered={false}
        ></ItemActionControls>
      )}
    </div>
  );
}

export default SidebarTitle;
