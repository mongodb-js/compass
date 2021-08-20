import React from 'react';
import PropTypes from 'prop-types';
import Toggle from '@leafygreen-ui/toggle';

import Actions from '../../actions';

import styles from '../connect.less';

class SRVInput extends React.PureComponent {
  static displayName = 'SRVInput';

  static propTypes = {
    currentConnectionAttempt: PropTypes.object,
    isSrvRecord: PropTypes.bool.isRequired
  };

  /**
   * Handles SRV record toggle.
   *
   * @param {boolean} newVal
   */
  onSRVRecordToggled(newVal) {
    Actions.onSRVRecordToggled(newVal);
  }

  render() {
    return (
      <div className={styles['form-item']}>
        <label id="srvRecordLabel" htmlFor="srvRecord">
          SRV Record
        </label>
        <div className={styles['form-item-switch-wrapper']}>
          <Toggle
            id="srvRecord"
            name="srvRecord"
            type="button"
            aria-labelledby="srvRecordLabel"
            disabled={!!this.props.currentConnectionAttempt}
            checked={this.props.isSrvRecord}
            onChange={this.onSRVRecordToggled.bind(this)}
            className={styles['form-control-switch']}
            // Workaround for leafygreen/emotioin style application order bug
            // that messes up the size of this input
            style={{ width: 62, height: 32 }}
          />
        </div>
      </div>
    );
  }
}

export default SRVInput;
