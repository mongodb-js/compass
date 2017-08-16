const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../actions');
const FormItemInput = require('./form-item-input');
const FormItemSelect = require('./form-item-select');

class ReplicaSetNameReadPreferenceSection extends React.Component {

  onReplicaSetNameChanged(evt) {
    Actions.onReplicaSetNameChanged(evt.target.value);
  }

  onReadPreferenceChanged(evt) {
    Actions.onReadPreferenceChanged(evt.target.value);
  }

  render() {
    return (
      <div id="read-preference" className="form-group">
        <FormItemInput
          label="Replica Set Name"
          name="replica_set_name"
          placeholder=""
          changeHandler={this.onReplicaSetNameChanged.bind(this)}
          value={this.props.currentConnection.replica_set_name} />
        <FormItemSelect
          label="Read Preference"
          name="read_preference"
          options={[
            {'primary': 'Primary'},
            {'primaryPreferred': 'Primary Preferred'},
            {'secondary': 'Secondary'},
            {'secondaryPreferred': 'Secondary Preferred'},
            {'nearest': 'Nearest'}
          ]}
          changeHandler={this.onReadPreferenceChanged.bind(this)}
          value={this.props.currentConnection.read_preference} />
      </div>
    );
  }
}

ReplicaSetNameReadPreferenceSection.propTypes = {
  currentConnection: PropTypes.object.isRequired
};

ReplicaSetNameReadPreferenceSection.displayName = 'ReplicaSetNameReadPreferenceSection';

module.exports = ReplicaSetNameReadPreferenceSection;
