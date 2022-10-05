import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, css, spacing } from '@mongodb-js/compass-components';

const collectionFieldName = css({
  margin: `${spacing[3]}px 0`
});

function CollectionName({
  collectionName,
  onChangeCollectionName
}) {
  return (
    <fieldset className={collectionFieldName}>
      <TextInput
        required
        label="Collection Name"
        data-testid="collection-name"
        onChange={(e) => onChangeCollectionName(e.target.value)}
        value={collectionName}
        spellCheck={false}
      />
    </fieldset>
  );
}

CollectionName.propTypes = {
  collectionName: PropTypes.string.isRequired,
  onChangeCollectionName: PropTypes.func.isRequired
};

export default CollectionName;
