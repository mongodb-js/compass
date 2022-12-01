import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, FormFieldContainer } from '@mongodb-js/compass-components';

function CollectionName({ collectionName, onChangeCollectionName }) {
  return (
    <FormFieldContainer>
      <TextInput
        required
        label="Collection Name"
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
