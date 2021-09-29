import React from 'react';
import PropTypes from 'prop-types';
import { TextInput } from '@mongodb-js/compass-components';

import FieldSet from '../field-set/field-set';

function DatabaseName({
  databaseName,
  onChangeDatabaseName
}) {
  return (
    <FieldSet>
      <TextInput
        required
        label="Database Name"
        onChange={(e) => onChangeDatabaseName(e.target.value)}
        value={databaseName}
      />
    </FieldSet>
  );
}

DatabaseName.propTypes = {
  databaseName: PropTypes.string.isRequired,
  onChangeDatabaseName: PropTypes.func.isRequired
};

export default DatabaseName;
