const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const { FormInput } = require('hadron-react-components');

class ReplicaSetInput extends React.PureComponent {
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

ReplicaSetInput.propTypes = {
  sshTunnel: PropTypes.string,
  replicaSet: PropTypes.string
};

ReplicaSetInput.displayName = 'ReplicaSetInput';

module.exports = ReplicaSetInput;
