/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import {
  MongoDBLogoMark
} from '@mongodb-js/compass-components';
import {
  getConnectionTitle,
} from 'mongodb-data-service';

import { NO_ACTIVE_NAMESPACE } from '../../modules/databases';
import styles from './sidebar-title.module.less';

const CollapsedTitle = ({
  connectionInfo
}) => {
  const isFavorite = !!connectionInfo.favorite;

  return (
    <div
      style={isFavorite ? {
        backgroundColor: connectionInfo.favorite.color || 'transparent'
      } : {}}
      className={styles['sidebar-title-logo']}
    >
      <MongoDBLogoMark
        color="white"
      />
    </div>
  );
};

CollapsedTitle.propTypes = {
  connectionInfo: PropTypes.object.isRequired
};

const ExpandedTitle = ({
  connectionInfo
}) => {
  return (
    <div className={styles['sidebar-title-name']}>
      {getConnectionTitle(connectionInfo)}
    </div>
  );
};

ExpandedTitle.propTypes = {
  connectionInfo: PropTypes.object.isRequired
};

const SidebarTitle = ({
  activeNamespace,
  connectionInfo,
  isSidebarExpanded,
  onClick
}) => {
  return (
    // TODO: https://jira.mongodb.org/browse/COMPASS-5918
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={classnames(styles['sidebar-title'], {
        [styles['sidebar-title-is-active']]: activeNamespace === NO_ACTIVE_NAMESPACE
      })}
      data-test-id="sidebar-title"
      onClick={onClick}
    >
      {isSidebarExpanded
        ? <ExpandedTitle
          connectionInfo={connectionInfo}
        />
        : <CollapsedTitle
          connectionInfo={connectionInfo}
        />
      }
    </div>
  );
};

SidebarTitle.displayName = 'SidebarTitleComponent';
SidebarTitle.propTypes = {
  activeNamespace: PropTypes.string.isRequired,
  connectionInfo: PropTypes.object.isRequired,
  isSidebarExpanded: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  activeNamespace: state.databases.activeNamespace
});

export default connect(mapStateToProps)(SidebarTitle);
export { SidebarTitle };
