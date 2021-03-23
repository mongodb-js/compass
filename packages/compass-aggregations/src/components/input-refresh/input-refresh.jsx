import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import styles from './input-refresh.less';

/**
 * Collapse/Expand a stage.
 */
class InputRefresh extends PureComponent {
  static displayName = 'InputRefreshComponent';

  static propTypes = {
    refreshInputDocuments: PropTypes.func.isRequired
  }

  /**
   * Render the input refresh component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={styles['input-refresh']}>
        <button
          type="button"
          title="Refresh Documents"
          onClick={this.props.refreshInputDocuments}
          className="btn btn-default btn-xs"
        >
          <i className="fa fa-repeat" aria-hidden />
        </button>
      </div>
    );
  }
}

export default InputRefresh;
