import React from 'react';
import {
  Editor,
  EditorVariant,
  CollapsibleFieldSet,
} from '@mongodb-js/compass-components';

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
      data-testid="create-index-modal-is-pfe"
      description="Partial indexes only index the documents in a collection that meet a specified filter expression."
    >
      <Editor
        text={partialFilterExpression}
        data-testid="create-index-modal-is-pfe-editor"
        variant={EditorVariant.Shell}
        onChangeText={partialFilterExpressionChanged}
        options={{ minLines: 10 }}
        name="create-index-modal-is-pfe-editor"
      />
    </CollapsibleFieldSet>
  );
};

export default PartialFilterCollapsibleFieldSet;
