import React, { Component } from 'react';
import classnames from 'classnames';

import styles from './collection-stats.less';

class CollectionStats extends Component {
  static displayName = 'CollectionStatsComponent';

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
    const views = (this.roles || []).map((role, i) => {
      return (<role.component key={i} {...this.props} />);
    });
    return (
      <div className={classnames(styles['collection-stats'])}>
        {views}
      </div>
    );
  }
}

export default CollectionStats;
export { CollectionStats };
