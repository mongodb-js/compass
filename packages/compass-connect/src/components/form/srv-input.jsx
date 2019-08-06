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
  onSRVRecordToggled() {
    Actions.onSRVRecordToggled();
  }

  render() {
    return (
      <div className={classnames(styles['connect-form-item'])}>
        <label className={classnames(styles['connect-form-item-label'])}>
          SRV Record
        </label>
        <div className={classnames(styles['connect-form-item-switch-wrapper'])}>
          <Switch
            checked={this.props.isSrvRecord}
            onChange={this.onSRVRecordToggled.bind(this)}
            className={classnames(styles['form-control-switch'])}
            onColor="rgb(19, 170, 82)"
            style={{ backgroundColor: 'rgb(255,255,255)'}} />
        </div>
      </div>
    );
  }
}

export default SRVInput;
