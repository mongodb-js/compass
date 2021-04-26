import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import styles from './create-tab.less';

class CreateTab extends PureComponent {
  static displayName = 'CreateTabComponent';

  static propTypes = {
    createNewTab: PropTypes.func.isRequired,
    activeNamespace: PropTypes.string.isRequired,
    activeIsReadonly: PropTypes.bool.isRequired,
    activeSourceName: PropTypes.string
  };

  /**
   * Create a new tab with the same namespace as the last one.
   */
  createTab = () => {
    this.props.createNewTab(
      this.props.activeNamespace,
      this.props.activeIsReadonly,
      this.props.activeSourceName
    );
  }

  /**
   * Render the Create Tab component.
   *
   * @returns {Component} The rendered component.
   */
  render() {
    return (
      <div className={styles['create-tab']} onClick={this.createTab}>
        +
      </div>
    );
  }
}

export default CreateTab;
