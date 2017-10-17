import app from 'hadron-app';
import { uniqueId } from 'lodash';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './collection-stats.less';

class CollectionStats extends Component {
  static displayName = 'CollectionStatsComponent';

  static propTypes = {
    actions: PropTypes.object.isRequired
  };

  state = {
    roles: []
  };

  componentWillMount() {
    this.setState({ roles: app.appRegistry.getRole('CollectionHUD.Item') });
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   *
   */
  render() {
    const { roles } = this.state;

    return (
      <div className={styles.component}>
        {roles.map((role) => React.createElement(role.component, {key: uniqueId()}))}
      </div>
    );
  }
}

export default CollectionStats;
export { CollectionStats };
