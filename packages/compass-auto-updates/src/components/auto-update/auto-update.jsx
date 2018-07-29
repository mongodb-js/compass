import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { TextButton } from 'hadron-react-buttons';
import classnames from 'classnames';

import styles from './auto-update.less';

const NOT_NOW = 'Not Now';

class AutoUpdate extends PureComponent {
  static displayName = 'AutoUpdateComponent';

  /**
   * When cancel is requested.
   */
  onCancel = () => {

  }

  /**
   * When update is requested.
   */
  onUpdate = () => {

  }

  /**
   * Render the Auto Update component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['auto-update-is-visible'])}>
        <div className={classnames(styles['auto-update-text'])}>
          A new version of Compass is ready.
        </div>
        <TextButton
          className="btn btn-default btn-xs"
          text="Update Compass"
          clickHandler={this.onUpdate} />
        <div className={classnames(styles['auto-update-cancel'])} onClick={this.onCancel}>
          {NOT_NOW}
        </div>
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = () => ({
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedAutoUpdate = connect(
  mapStateToProps,
  {},
)(AutoUpdate);

export default MappedAutoUpdate;
