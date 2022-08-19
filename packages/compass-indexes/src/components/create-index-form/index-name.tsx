import React from 'react';
import { TextInput, CollapsibleFieldSet } from '@mongodb-js/compass-components';

type IndexName = {
  indexName: string;
  nameChanged: (indexName: string) => void;
  useIndexName: boolean;
  toggleUseIndexName: (useIndexName: boolean) => void;
};

const IndexNameCollapsibleFieldSet = ({
  indexName,
  nameChanged,
  useIndexName,
  toggleUseIndexName,
}: IndexName) => {
  return (
    <CollapsibleFieldSet
      toggled={useIndexName}
      onToggle={toggleUseIndexName}
      label="Index name"
      dataTestId="create-index-modal-use-index-name-checkbox"
      description="Enter the name of the index to create, or leave blank to have MongoDB create a default name for the index."
    >
      <TextInput
        label=""
        value={indexName}
        data-testid="create-index-modal-use-index-name-input"
        type="text"
        onChange={(e) => nameChanged(e.target.value)}
        spellCheck={false}
        optional
      />
    </CollapsibleFieldSet>
  );
};

export default IndexNameCollapsibleFieldSet;
