import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import Switch from 'react-ios-switch';
import classnames from 'classnames';

import styles from '../connect.less';

class SRVInput extends React.PureComponent {
  static displayName = 'SRVInput';

  static propTypes = { isSrvRecord: PropTypes.bool.isRequired };

  /**
   * Handles SRV record toggle.
   *
   * @param {Object} evt - evt.
   */
  onSRVRecordToggle() {
    Actions.onSRVRecordToggle();
  }

  render() {
    return (
      <div className={classnames(styles['form-item'])}>
        <label>
          <span className={classnames(styles['form-item-label'])}>
            SRV Record
          </span>
        </label>
        <div className={classnames(styles['form-item-switch-wrapper'])}>
          <Switch
            checked={this.props.isSrvRecord}
            onChange={this.onSRVRecordToggle.bind(this)}
            className={classnames(styles['form-control-switch'])}
            onColor="rgb(19, 170, 82)"
            style={{ backgroundColor: 'rgb(255,255,255)'}} />
        </div>
      </div>
    );
  }
}

export default SRVInput;
