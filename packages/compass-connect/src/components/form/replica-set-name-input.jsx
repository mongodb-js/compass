const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const { FormInput } = require('hadron-react-components');

class ReplicaSetNameInput extends React.PureComponent {

  onReplicaSetNameChanged(evt) {
    Actions.onReplicaSetNameChanged(evt.target.value);
  }

  render() {
    const sshTunnel = this.props.sshTunnel;
    if (sshTunnel === 'NONE' || !sshTunnel) {
      return (
        <FormInput
          label="Replica Set Name"
          name="replica_set_name"
          changeHandler={this.onReplicaSetNameChanged.bind(this)}
          value={this.props.replicaSetName || ''} />
      );
    }
    return null;
  }
}

ReplicaSetNameInput.propTypes = {
  sshTunnel: PropTypes.string,
  replicaSetName: PropTypes.string
};

ReplicaSetNameInput.displayName = 'ReplicaSetNameInput';

module.exports = ReplicaSetNameInput;
