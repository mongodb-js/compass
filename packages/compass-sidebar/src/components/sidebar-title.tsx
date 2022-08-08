import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { getConnectionTitle } from 'mongodb-data-service';
import type { ConnectionInfo } from 'mongodb-data-service';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';

import {
  MongoDBLogoMark,
  css,
  cx,
  uiColors,
  spacing,
  ItemActionControls,
} from '@mongodb-js/compass-components';

import type { ItemAction } from '@mongodb-js/compass-components';

type Actions = 'copy-connection-string' | 'edit-favorite' | 'cluster-info';

const titleContainer = css({
  // TODO: move, also we need dark colors too
  '--title-color': 'white',
  '--title-bg-color': uiColors.green.dark2,

  '--icon-color': 'white',
  // TODO: ok so using the hover version makes no sense and we do have to actually specify "normal" tpo ItemActionControls
  '--hover-icon-color': 'white',
  // TODO: we also need a -hover foreground colour in this case

  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  color: 'var(--title-color)',
  backgroundColor: 'var(--title-bg-color)',

  height: spacing[6] + spacing[1],
  padding: spacing[3],
});

const titleLabel = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontSize: '18px', // TODO: what's the right way to do this?
  fontWeight: 600, // TODO: 500 once we have the new font
  marginLeft: '2px',
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

const logoContainer = css({
  width: spacing[5],
  paddingLeft: spacing[1],
  marginTop: '6px',
  flexShrink: 0,
});

function TitleLogo() {
  return (
    <div className={logoContainer}>
      <MongoDBLogoMark color="green-base" height={32} />
    </div>
  );
}

const mapStateToProps = (
  state: any
): {
  activeNamespace: string;
  connectionInfo: ConnectionInfo;
} => ({
  activeNamespace: state.databases.activeNamespace,
  connectionInfo: state.connectionInfo.connectionInfo,
});

const connector = connect(mapStateToProps, {
  globalAppRegistryEmit,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & {
  isSidebarExpanded?: boolean;
};

function SidebarTitle({
  //isSidebarExpanded=false,
  connectionInfo,
  globalAppRegistryEmit,
}: Props) {
  const title = getConnectionTitle(connectionInfo);

  const isActive = false;
  const isHovered = true;

  const onAction = useCallback((action: Actions) => {
    console.log(action);
  }, []);

  const actions = useMemo(() => {
    const actions: ItemAction<Actions>[] = [
      {
        action: 'copy-connection-string',
        label: 'Copy connection string',
        icon: 'Copy',
      },
      // TODO: only if there is a favorite or should we turn it into save favorite if not?
      {
        action: 'edit-favorite',
        label: 'Edit favorite',
        icon: 'Favorite',
      },
      {
        action: 'cluster-info',
        label: 'Cluster info',
        icon: 'Connect',
      },
    ];

    return actions;
  }, []);
  return (
    // TODO: https://jira.mongodb.org/browse/COMPASS-5918
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={titleContainer}
      onClick={() => globalAppRegistryEmit('open-instance-workspace')}
    >
      <TitleLogo />
      <TitleLabel title={title}>{title}</TitleLabel>

      <ItemActionControls<Actions>
        onAction={onAction}
        isActive={isActive}
        isHovered={isHovered}
        actions={actions}
        shouldCollapseActionsToMenu
      ></ItemActionControls>
    </div>
  );
}

const MappedSidebarTitle = connector(SidebarTitle);

export default MappedSidebarTitle;
