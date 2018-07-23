const React = require('react');
const PropTypes = require('prop-types');
const Actions = require('../../actions');
const FormItemSelect = require('./form-item-select');

class ReadPreferenceSelect extends React.PureComponent {

  onReadPreferenceChanged(evt) {
    Actions.onReadPreferenceChanged(evt.target.value);
  }

  render() {
    return (
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
        value={this.props.readPreference} />
    );
  }
}

ReadPreferenceSelect.propTypes = {
  readPreference: PropTypes.string.isRequired
};

ReadPreferenceSelect.displayName = 'ReadPreferenceSelect';

module.exports = ReadPreferenceSelect;
