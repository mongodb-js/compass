import React from 'react';
import { TextInput, CollapsibleFieldSet } from '@mongodb-js/compass-components';

type PartialFilter = {
  usePartialFilterExpression: boolean;
  toggleUsePartialFilterExpression: (
    usePartialFilterExpression: boolean
  ) => void;
  partialFilterExpression?: string;
  partialFilterExpressionChanged: (partialFilterExpression: string) => void;
};

const PartialFilterCollapsibleFieldSet = ({
  usePartialFilterExpression,
  toggleUsePartialFilterExpression,
  partialFilterExpression,
  partialFilterExpressionChanged,
}: PartialFilter) => {
  return (
    <CollapsibleFieldSet
      toggled={usePartialFilterExpression}
      onToggle={toggleUsePartialFilterExpression}
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
        onChange={(e) => partialFilterExpressionChanged(e.target.value)}
        spellCheck={false}
      />
    </CollapsibleFieldSet>
  );
};

export default PartialFilterCollapsibleFieldSet;
