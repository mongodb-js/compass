import React, { useMemo } from 'react';
import { css, spacing, Accordion, Body } from '@mongodb-js/compass-components';
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
  onSelectFieldNameClick: (idx: number, name: string) => void;
  onSelectFieldTypeClick: (idx: number, fType: string) => void;
  onAddFieldClick: () => void; // Plus icon.
  onRemoveFieldClick: (idx: number) => void; // Minus icon.
  showIndexesGuidanceVariant: boolean;
};

function CreateIndexForm({
  namespace,
  fields,
  serverVersion,
  onSelectFieldNameClick,
  onSelectFieldTypeClick,
  onAddFieldClick,
  onRemoveFieldClick,
  showIndexesGuidanceVariant,
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

  return (
    <>
      <div
        className={createIndexModalFieldsStyles}
        data-testid="create-index-form"
      >
        {/* @experiment Early Journey Indexes Guidance & Awareness  | Jira Epic: CLOUDP-239367 */}
        {showIndexesGuidanceVariant && (
          <Body>
            The best indexes for your application should consider a number of
            factors, such as your data model, and the queries you use most
            often. To learn more about indexing best practices, read the{' '}
            <a
              href="https://docs.mongodb.com/manual/applications/indexes/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Index Strategies Documentation.
            </a>
          </Body>
        )}

        <Body weight="medium" className={indexFieldsHeaderStyles}>
          Index fields
        </Body>
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
