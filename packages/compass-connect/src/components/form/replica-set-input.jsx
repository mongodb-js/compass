import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import { FormInput } from 'hadron-react-components';
import classnames from 'classnames';

import styles from '../connect.less';

class ReplicaSetInput extends React.PureComponent {
  static displayName = 'ReplicaSetInput';

  static propTypes = {
    sshTunnel: PropTypes.string,
    replicaSet: PropTypes.string
  };

  /**
   * Handles a replica set change.
   *
   * @param {Object} evt - evt.
   */
  onReplicaSetChanged(evt) {
    Actions.onReplicaSetChanged(evt.target.value);
  }

  render() {
    const sshTunnel = this.props.sshTunnel;

    if (sshTunnel === 'NONE' || !sshTunnel) {
      return (
        <div className={classnames(styles['connect-form-item-container'])}>
          <FormInput
            label="Replica Set Name"
            name="replicaSet"
            changeHandler={this.onReplicaSetChanged.bind(this)}
            value={this.props.replicaSet || ''} />
        </div>
      );
    }

    return null;
  }
}

export default ReplicaSetInput;
