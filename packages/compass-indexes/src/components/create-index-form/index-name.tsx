import React from 'react';
import { TextInput, CollapsibleFieldSet } from '@mongodb-js/compass-components';

type IndexName = {
  indexName: string;
  changeName: (indexName: string) => any;
  hasIndexName: boolean;
  toggleHasIndexName: (hasIndexName: boolean) => any;
};

const IndexNameCollapsibleFieldSet = ({
  indexName,
  changeName,
  hasIndexName,
  toggleHasIndexName,
}: IndexName) => {
  return (
    <CollapsibleFieldSet
      toggled={hasIndexName}
      onToggle={(checked: boolean) => toggleHasIndexName(checked)}
      label="Index name"
      dataTestId="create-index-modal-has-index-name-checkbox"
      description="Enter the name of the index to create, or leave blank to have MongoDB create a default name for the index."
    >
      <TextInput
        label=""
        value={indexName}
        data-testid="create-index-modal-has-index-name-input"
        type="text"
        onChange={(e) => changeName(e.target.value)}
        spellCheck={false}
        optional
      />
    </CollapsibleFieldSet>
  );
};

export default IndexNameCollapsibleFieldSet;
