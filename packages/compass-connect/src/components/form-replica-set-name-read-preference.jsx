const React = require('react');
const Actions = require('../actions');
const FormItemInput = require('./form-item-input');
const FormItemSelect = require('./form-item-select');

class FormReplicaSetNameReadPreference extends React.Component {

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
          blurHandler={this.onReplicaSetNameChanged.bind(this)} />
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
          changeHandler={this.onReadPreferenceChanged.bind(this)} />
      </div>
    );
  }
}

FormReplicaSetNameReadPreference.displayName = 'FormReplicaSetNameReadPreference';

module.exports = FormReplicaSetNameReadPreference;
