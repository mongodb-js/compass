import React from 'react';
import PropTypes from 'prop-types';
import { TextInput } from '@mongodb-js/compass-components';

import FieldSet from '../field-set/field-set';

function CollectionName({
  collectionName,
  onChangeCollectionName
}) {
  return (
    <FieldSet>
      <TextInput
        required
        label="Collection Name"
        data-testid="collection-name"
        onChange={(e) => onChangeCollectionName(e.target.value)}
        value={collectionName}
        spellCheck={false}
      />
    </FieldSet>
  );
}

CollectionName.propTypes = {
  collectionName: PropTypes.string.isRequired,
  onChangeCollectionName: PropTypes.func.isRequired
};

export default CollectionName;
