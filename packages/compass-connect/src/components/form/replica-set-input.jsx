import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import FormInput from './form-input';

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
        <FormInput
          label="Replica Set Name"
          name="replicaSet"
          changeHandler={this.onReplicaSetChanged.bind(this)}
          value={this.props.replicaSet || ''} />
      );
    }

    return null;
  }
}

export default ReplicaSetInput;
