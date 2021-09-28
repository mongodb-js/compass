import React from 'react';
import PropTypes from 'prop-types';
import { Toggle } from '@mongodb-js/compass-components';

import Actions from '../../../../actions';
import styles from '../../../connect.module.less';

class CnameInput extends React.PureComponent {
  static displayName = 'CnameInput';

  static propTypes = {
    canonicalize_hostname: PropTypes.bool.isRequired
  };

  onCnameToggle(newVal) {
    Actions.onCnameToggle(newVal);
    Actions.onConnectionFormChanged();
  }

  render() {
    return (
      <div className={styles['form-item']}>
        <label id="canonicalizeHostNameLabel" htmlFor="canonicalizeHostName">
          Canonicalize Host Name
        </label>
        <div className={styles['form-item-switch-wrapper']}>
          <Toggle
            id="canonicalizeHostName"
            name="canonicalizeHostName"
            type="button"
            aria-labelledby="canonicalizeHostNameLabel"
            checked={this.props.canonicalize_hostname}
            onChange={this.onCnameToggle}
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

export default CnameInput;
