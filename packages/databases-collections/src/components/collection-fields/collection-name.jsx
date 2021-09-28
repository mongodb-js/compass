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
        onChange={(e) => onChangeCollectionName(e.target.value)}
        value={collectionName}
      />
    </FieldSet>
  );
}

CollectionName.propTypes = {
  collectionName: PropTypes.string.isRequired,
  onChangeCollectionName: PropTypes.func.isRequired
};

export default CollectionName;
