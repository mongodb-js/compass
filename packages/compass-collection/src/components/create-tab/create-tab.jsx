import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import styles from './create-tab.module.less';

class CreateTab extends PureComponent {
  static displayName = 'CreateTabComponent';

  static propTypes = {
    createNewTab: PropTypes.func.isRequired
  };

  /**
   * Render the Create Tab component.
   *
   * @returns {Component} The rendered component.
   */
  render() {
    return (
      <div
        className={styles['create-tab']}
        onClick={() => this.props.createNewTab()}
      >
        +
      </div>
    );
  }
}

export default CreateTab;
