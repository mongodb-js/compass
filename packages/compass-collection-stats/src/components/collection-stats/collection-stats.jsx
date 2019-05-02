import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './collection-stats.less';

class CollectionStats extends Component {
  static displayName = 'CollectionStatsComponent';

  static propTypes = {
    isReadonly: PropTypes.bool
  };

  /**
   * Instantiate the component.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.roles = global.hadronApp.appRegistry.getRole('CollectionHUD.Item');
  }

  /**
   * Render CollectionStats component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    if (this.props.isReadonly === true) {
      return <div className={styles['collection-stats-empty']} />;
    }

    const children = (this.roles || []).map((role, i) => {
      return <role.component key={i} {...this.props} />;
    });
    return <div className={styles['collection-stats']}>{children}</div>;
  }
}

export default CollectionStats;
export { CollectionStats };
