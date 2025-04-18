import React, { useMemo } from 'react';
import {
  css,
  spacing,
  Accordion,
  Body,
  palette,
  Button,
} from '@mongodb-js/compass-components';
import type { Field } from '../../modules/create-index';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import { CreateIndexFields } from '../create-index-fields';
import { hasColumnstoreIndexesSupport } from '../../utils/columnstore-indexes';
import CheckboxInput from './checkbox-input';
import CollapsibleInput from './collapsible-input';
import {
  useConnectionInfo,
  useConnectionSupports,
} from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';

const createIndexModalFieldsStyles = css({
  margin: `${spacing[600]}px 0 ${spacing[800]}px 0`,
});

const indexFieldsHeaderStyles = css({
  marginBottom: spacing[100],
});

const createIndexModalOptionStyles = css({
  paddingLeft: spacing[100] + 2,
});

const plainBorderedCalloutStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '12px',
  padding: spacing[600],
  minHeight: '132px',
});

const coveredQueriesButtonStyles = css({
  height: spacing[600] + 4,
  float: 'right',
  marginTop: spacing[400],
});

type CreateIndexFormProps = {
  namespace: string;
  fields: Field[];
  serverVersion: string;
  onSelectFieldNameClick: (idx: number, name: string) => void;
  onSelectFieldTypeClick: (idx: number, fType: string) => void;
  onAddFieldClick: () => void; // Plus icon.
  onRemoveFieldClick: (idx: number) => void; // Minus icon.
};

function CreateIndexForm({
  namespace,
  fields,
  serverVersion,
  onSelectFieldNameClick,
  onSelectFieldTypeClick,
  onAddFieldClick,
  onRemoveFieldClick,
}: CreateIndexFormProps) {
  const { id: connectionId } = useConnectionInfo();
  const rollingIndexesFeatureEnabled = !!usePreference('enableRollingIndexes');
  const supportsRollingIndexes = useConnectionSupports(
    connectionId,
    'rollingIndexCreation'
  );
  const showRollingIndexOption =
    rollingIndexesFeatureEnabled && supportsRollingIndexes;
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

  const showIndexesGuidanceVariant = true;
  return (
    <>
      <div
        className={createIndexModalFieldsStyles}
        data-testid="create-index-form"
      >
        <Body weight="medium" className={indexFieldsHeaderStyles}>
          Index fields
        </Body>
        <div
          className={
            showIndexesGuidanceVariant ? plainBorderedCalloutStyles : ''
          }
        >
          {fields.length > 0 ? (
            <CreateIndexFields
              schemaFields={schemaFieldNames}
              fields={fields}
              serverVersion={serverVersion}
              isRemovable={!(fields.length > 1)}
              onSelectFieldNameClick={onSelectFieldNameClick}
              onSelectFieldTypeClick={onSelectFieldTypeClick}
              onAddFieldClick={onAddFieldClick}
              onRemoveFieldClick={onRemoveFieldClick}
            />
          ) : null}
          <Button
            className={coveredQueriesButtonStyles}
            onClick={() => {
              // TODO in CLOUDP-311782
              // TODO in CLOUDP-311783
            }}
          >
            Show me covered queries
          </Button>
        </div>
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
          {showRollingIndexOption && (
            <CheckboxInput name="buildInRollingProcess"></CheckboxInput>
          )}
        </div>
      </Accordion>
    </>
  );
}

export { CreateIndexForm };
