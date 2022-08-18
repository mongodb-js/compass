import React from 'react';
import { TextInput, CollapsibleFieldSet } from '@mongodb-js/compass-components';

type PartialFilter = {
  isPartialFilterExpression: boolean;
  toggleIsPartialFilterExpression: (isPartialFilterExpression: boolean) => any;
  partialFilterExpression?: string;
  changePartialFilterExpression: (partialFilterExpression: string) => any;
};

const PartialFilterCollapsibleFieldSet = ({
  isPartialFilterExpression,
  toggleIsPartialFilterExpression,
  partialFilterExpression,
  changePartialFilterExpression,
}: PartialFilter) => {
  return (
    <CollapsibleFieldSet
      toggled={isPartialFilterExpression}
      onToggle={(checked: boolean) => toggleIsPartialFilterExpression(checked)}
      label="Partial Filter Expression"
      dataTestId="create-index-modal-is-pfe-checkbox"
      description="Partial indexes only index the documents in a collection that meet a specified filter expression."
    >
      <TextInput
        value={partialFilterExpression}
        data-testid="create-index-modal-is-pfe-input"
        type="text"
        aria-label="Partial Filter Expression"
        aria-labelledby="create-index-modal-is-pfe-checkbox"
        onChange={(e) => changePartialFilterExpression(e.target.value)}
        spellCheck={false}
      />
    </CollapsibleFieldSet>
  );
};

export default PartialFilterCollapsibleFieldSet;
