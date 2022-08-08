import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { ResizableSidebar } from '@mongodb-js/compass-components';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';

import SidebarDatabasesNavigation from './sidebar-databases-navigation';
import SidebarTitle from './sidebar-title';
import FavoriteIndicator from './favorite-indicator';

import { toggleIsDetailsExpanded } from '../modules/is-details-expanded';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { changeFilterRegex } from '../modules/databases';
import { updateAndSaveConnectionInfo } from '../modules/connection-info';

const mapStateToProps = (state: any) => ({
  // TODO: type the state
  connectionInfo: state.connectionInfo.connectionInfo,
  connectionOptions: state.connectionOptions,
  instance: state.instance,
  databases: state.databases.databases,
  isDetailsExpanded: state.isDetailsExpanded,
  isGenuineMongoDBVisible: state.isGenuineMongoDBVisible,
});

const connector = connect(mapStateToProps, {
  toggleIsDetailsExpanded,
  toggleIsGenuineMongoDBVisible,
  changeFilterRegex,
  globalAppRegistryEmit,
  updateAndSaveConnectionInfo,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux;

// eslint-disable-next-line no-empty-pattern
export function Sidebar({ connectionInfo }: Props) {
  // TODO: toggle sidebar
  // TODO: sidebar title
  // TODO: sidebar instance
  //   - instance stats
  //   - favourite button?
  //   - csfle marker
  //   - csfle connection modal
  //   - save connection modal
  //   - non genuine warning pill
  //   - sidebar instance details
  // TODO: navigation items
  // TODO: filter
  // TODO: create database
  // TODO: non genuine warning label

  return (
    <ResizableSidebar>
      <>
        <SidebarTitle />
        {connectionInfo.favorite && (
          <FavoriteIndicator favorite={connectionInfo.favorite} />
        )}
        <SidebarDatabasesNavigation />
      </>
    </ResizableSidebar>
  );
}

const MappedSidebar = connector(Sidebar);

export default MappedSidebar;
