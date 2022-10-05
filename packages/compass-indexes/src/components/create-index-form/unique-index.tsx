import React from 'react';
import { Checkbox, Label, css, spacing } from '@mongodb-js/compass-components';

type UniqueIndex = {
  isUnique: boolean;
  toggleIsUnique: (isUnique: boolean) => void;
};

const uniqueIndexStyles = css({
  margin: `${spacing[3]}px 0`,
  fieldset: {
    paddingLeft: `${spacing[4]}px`,
  },
});

const UniqueIndexCheckbox = ({ isUnique, toggleIsUnique }: UniqueIndex) => {
  const labelId = 'create-index-modal-is-unique-checkbox';
  return (
    <fieldset className={uniqueIndexStyles}>
      <Checkbox
        data-testid="create-index-modal-is-unique-checkbox"
        onChange={(event) => {
          toggleIsUnique(event.target.checked);
        }}
        label={<Label htmlFor={labelId}>Create unique index</Label>}
        // LG Checkbox expects a string description, but we use Description component
        // to alight with styles from CollapsibleFieldSet that are used on the same form.
        description={
          'A unique index ensures that the indexed fields do not store duplicate values; i.e. enforces uniqueness for the indexed fields.'
        }
        checked={isUnique}
        id={labelId}
      />
    </fieldset>
  );
};

export default UniqueIndexCheckbox;
