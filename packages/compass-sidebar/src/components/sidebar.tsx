import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { spacing, ResizableSidebar } from '@mongodb-js/compass-components';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';

import SidebarDatabasesNavigation from './sidebar-databases-navigation';
import { toggleIsDetailsExpanded } from '../modules/is-details-expanded';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { changeFilterRegex } from '../modules/databases';
import { updateAndSaveConnectionInfo } from '../modules/connection-info';

const initialSidebarWidth = spacing[6] * 4 - spacing[1]; // 252px
const minSidebarWidth = spacing[4] * 9; // 216px

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
export function Sidebar({}: Props) {
  // TODO: toggle sidebar
  // TODO: sidebar title
  // TODO: sidebar instance
  //   - instance stats
  //   - favourite button
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
    <ResizableSidebar
      minWidth={minSidebarWidth}
      initialWidth={initialSidebarWidth}
      darkMode={false}
    >
      <SidebarDatabasesNavigation />
    </ResizableSidebar>
  );
}

const MappedSidebar = connector(Sidebar);

export default MappedSidebar;
