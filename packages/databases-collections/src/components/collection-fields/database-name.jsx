import React from 'react';
import PropTypes from 'prop-types';
import {
  TextInput,
  FormFieldContainer,
  useTranslation,
} from '@mongodb-js/compass-components';

function DatabaseName({ databaseName, onChangeDatabaseName }) {
  const t = useTranslation();
  return (
    <FormFieldContainer>
      <TextInput
        required
        label={t('databasesCollections.fields.databaseName', 'Database Name')}
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
