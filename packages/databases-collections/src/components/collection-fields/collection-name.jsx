import React from 'react';
import PropTypes from 'prop-types';
import {
  TextInput,
  FormFieldContainer,
  useTranslation,
} from '@mongodb-js/compass-components';

function CollectionName({ collectionName, onChangeCollectionName }) {
  const t = useTranslation();
  return (
    <FormFieldContainer>
      <TextInput
        required
        label={t(
          'databasesCollections.fields.collectionName',
          'Collection Name'
        )}
        data-testid="collection-name"
        onChange={(e) => onChangeCollectionName(e.target.value)}
        value={collectionName}
        spellCheck={false}
      />
    </FormFieldContainer>
  );
}

CollectionName.propTypes = {
  collectionName: PropTypes.string.isRequired,
  onChangeCollectionName: PropTypes.func.isRequired,
};

export default CollectionName;
