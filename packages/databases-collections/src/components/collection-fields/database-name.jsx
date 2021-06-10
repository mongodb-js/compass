import React from 'react';
import PropTypes from 'prop-types';
import TextInput from '@leafygreen-ui/text-input';

import FieldSet from '../field-set/field-set';

function DatabaseName({
  onChangeDatabaseName
}) {
  return (
    <FieldSet>
      <TextInput
        required
        label="Database Name"
        onChange={(e) => onChangeDatabaseName(e.target.value)}
      />
    </FieldSet>
  );
}

DatabaseName.propTypes = {
  onChangeDatabaseName: PropTypes.func.isRequired
};

export default DatabaseName;
