import React from 'react';
import PropTypes from 'prop-types';

import NewConnection from './new-connection';
import Favorites from './favorites';
import Recents from './recents';

import styles from './sidebar.module.less';

class Sidebar extends React.Component {
  static displayName = 'Sidebar';

  static propTypes = {
    connectionModel: PropTypes.object.isRequired,
    connections: PropTypes.object.isRequired
  };

  render() {
    return (
      <div>
        <div className={styles['connect-sidebar']}>
          <NewConnection {...this.props} />
          <div className={styles['connect-sidebar-connections']}>
            <Favorites {...this.props} />
            <Recents {...this.props} />
          </div>
        </div>
      </div>
    );
  }
}

export default Sidebar;
