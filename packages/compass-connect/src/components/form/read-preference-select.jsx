import React from 'react';
import PropTypes from 'prop-types';
import Actions from 'actions';
import FormItemSelect from './form-item-select';

class ReadPreferenceSelect extends React.PureComponent {
  static displayName = 'ReadPreferenceSelect';

  static propTypes = { readPreference: PropTypes.string.isRequired };

  /**
   * Handles a read preference change.
   *
   * @param {Object} evt - evt.
   */
  onReadPreferenceChanged(evt) {
    Actions.onReadPreferenceChanged(evt.target.value);
  }

  render() {
    return (
      <FormItemSelect
        label="Read Preference"
        name="readPreference"
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

export default ReadPreferenceSelect;
