import React, { useMemo } from 'react';
import { css, spacing, Accordion, Body } from '@mongodb-js/compass-components';
import type { Field } from '../../modules/create-index';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import { CreateIndexFields } from '../create-index-fields';
import { hasColumnstoreIndexesSupport } from '../../utils/columnstore-indexes';
import CheckboxInput from './checkbox-input';
import CollapsibleInput from './collapsible-input';

const createIndexModalFieldsStyles = css({
  margin: `${spacing[4]}px 0 ${spacing[5]}px 0`,
});

const indexFieldsHeaderStyles = css({
  marginBottom: spacing[1],
});

const createIndexModalOptionStyles = css({
  paddingLeft: spacing[1] + 2,
});

type CreateIndexFormProps = {
  namespace: string;
  fields: Field[];
  serverVersion: string;
  updateFieldName: (idx: number, name: string) => void;
  fieldTypeUpdated: (idx: number, fType: string) => void;
  fieldAdded: () => void; // Plus icon.
  fieldRemoved: (idx: number) => void; // Minus icon.
};

function CreateIndexForm({
  namespace,
  fields,
  serverVersion,
  updateFieldName,
  fieldTypeUpdated,
  fieldAdded,
  fieldRemoved,
}: CreateIndexFormProps) {
  const schemaFields = useAutocompleteFields(namespace);
  const schemaFieldNames = useMemo(() => {
    return schemaFields
      .filter((field) => {
        return field.name !== '_id';
      })
      .map((field) => {
        return field.name;
      });
  }, [schemaFields]);

  return (
    <>
      <div
        className={createIndexModalFieldsStyles}
        data-testid="create-index-form"
      >
        <Body weight="medium" className={indexFieldsHeaderStyles}>
          Index fields
        </Body>
        {fields.length > 0 ? (
          <CreateIndexFields
            schemaFields={schemaFieldNames}
            fields={fields}
            serverVersion={serverVersion}
            isRemovable={!(fields.length > 1)}
            updateFieldName={updateFieldName}
            fieldTypeUpdated={fieldTypeUpdated}
            fieldAdded={fieldAdded}
            fieldRemoved={fieldRemoved}
          />
        ) : null}
      </div>
      <Accordion data-testid="create-index-modal-toggle-options" text="Options">
        <div
          data-testid="create-index-modal-options"
          className={createIndexModalOptionStyles}
        >
          <CheckboxInput name="unique"></CheckboxInput>
          <CollapsibleInput name="name"></CollapsibleInput>
          <CollapsibleInput name="expireAfterSeconds"></CollapsibleInput>
          <CollapsibleInput name="partialFilterExpression"></CollapsibleInput>
          <CollapsibleInput name="wildcardProjection"></CollapsibleInput>
          <CollapsibleInput name="collation"></CollapsibleInput>
          {hasColumnstoreIndexesSupport(serverVersion) && (
            <CollapsibleInput name="columnstoreProjection"></CollapsibleInput>
          )}
          <CheckboxInput name="sparse"></CheckboxInput>
        </div>
      </Accordion>
    </>
  );
}

export { CreateIndexForm };
