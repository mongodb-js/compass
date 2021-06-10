import React from 'react';
import PropTypes from 'prop-types';
import TextInput from '@leafygreen-ui/text-input';

import FieldSet from '../field-set/field-set';

function CollectionName({
  onChangeCollectionName
}) {
  return (
    <FieldSet>
      <TextInput
        required
        label="Collection Name"
        onChange={(e) => onChangeCollectionName(e.target.value)}
      />
    </FieldSet>
  );
}

CollectionName.propTypes = {
  onChangeCollectionName: PropTypes.func.isRequired
};

export default CollectionName;
