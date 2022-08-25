import React from 'react';
import {
  Checkbox,
  Label,
  Description,
  css,
  spacing,
} from '@mongodb-js/compass-components';

type SparseIndex = {
  isSparse: boolean;
  toggleIsSparse: (isSparse: boolean) => void;
};

const sparseIndexStyles = css({
  margin: `${spacing[3]}px 0`,
  fieldset: {
    paddingLeft: `${spacing[4]}px`,
  },
});

const SparseIndexCheckbox = ({ isSparse, toggleIsSparse }: SparseIndex) => {
  const labelId = 'create-index-modal-is-sparse-checkbox';
  return (
    <fieldset className={sparseIndexStyles}>
      <Checkbox
        data-testid="create-index-modal-is-sparse-checkbox"
        onChange={(event) => {
          toggleIsSparse(event.target.checked);
        }}
        label={<Label htmlFor={labelId}>Create sparse index</Label>}
        // LG Checkbox expects a string description, but we use Description component
        // to alight with styles from CollapsibleFieldSet that are used on the same form.
        description={
          (
            <Description>
              Sparse indexes only contain entries for documents that have the
              indexed field, even if the index field contains a null value. The
              index skips over any document that is missing the indexed field.
            </Description>
          ) as any
        }
        checked={isSparse}
        id={labelId}
      />
    </fieldset>
  );
};

export default SparseIndexCheckbox;
