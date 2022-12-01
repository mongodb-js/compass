import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, FormFieldContainer } from '@mongodb-js/compass-components';

function DatabaseName({ databaseName, onChangeDatabaseName }) {
  return (
    <FormFieldContainer>
      <TextInput
        required
        label="Database Name"
        data-testid="database-name"
        onChange={(e) => onChangeDatabaseName(e.target.value)}
        value={databaseName}
        spellCheck={false}
      />
    </FormFieldContainer>
  );
}

DatabaseName.propTypes = {
  databaseName: PropTypes.string.isRequired,
  onChangeDatabaseName: PropTypes.func.isRequired,
};

export default DatabaseName;
