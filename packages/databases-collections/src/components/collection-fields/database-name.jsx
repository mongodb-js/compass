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
        data-testid="database-name"
        onChange={(e) => onChangeDatabaseName(e.target.value)}
        value={databaseName}
        spellCheck={false}
      />
    </FieldSet>
  );
}

DatabaseName.propTypes = {
  databaseName: PropTypes.string.isRequired,
  onChangeDatabaseName: PropTypes.func.isRequired
};

export default DatabaseName;
