import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import bsonCSV from '../../utils/bson-csv';

import { createDebug } from '../../utils/logger';
const debug = createDebug('select-field-type');

function getBSONTypeCastings() {
  return Object.keys(bsonCSV);
}

class SelectFieldType extends PureComponent {
  static propTypes = {
    selectedType: PropTypes.string,
    onChange: PropTypes.func.isRequired
  };

  onChange(evt) {
    debug('type changed', evt.currentTarget.value);
    this.props.onChange(evt.currentTarget.value);
  }
  render() {
    const { selectedType } = this.props;
    const onChange = this.onChange.bind(this);

    /**
     * TODO: lucas: Handle JSON casting.
     */
    return (
      <select defaultValue={selectedType} onChange={onChange}>
        {getBSONTypeCastings().map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    );
  }
}
export default SelectFieldType;
