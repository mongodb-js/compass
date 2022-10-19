import React from 'react';
import { css, spacing, Accordion, Body } from '@mongodb-js/compass-components';

import { CreateIndexFields } from '../create-index-fields';
import { hasColumnstoreIndexesSupport } from '../../utils/has-columnstore-indexes-support';
import UniqueIndexCheckbox from './unique-index';
import TTLCollapsibleFieldSet from './ttl';
import PartialFilterCollapsibleFieldSet from './partial-filter-expression';
import CustomCollationCollapsibleFieldSet from './custom-collation';
import WildcardProjectionCollapsibleFieldSet from './wildcard-projection';
import ColumnstoreProjectionCollapsibleFieldSet from './columnstore-projection';
import IndexNameCollapsibleFieldSet from './index-name';
import SparseIndexCheckbox from './sparse-index';

const createIndexModalFieldsStyles = css({
  margin: `${spacing[4]}px 0 ${spacing[5]}px 0`,
});

const indexFieldsHeaderStyles = css({
  marginBottom: spacing[1],
});

const createIndexModalOptionStyles = css({
  paddingLeft: spacing[1] + 2,
});

type IndexField = { name: string; type: string };

type CreateIndexFormProps = {
  fields: IndexField[];
  newIndexField: string | null;
  schemaFields: string[];

  isUnique: boolean;
  isSparse: boolean;

  useIndexName: boolean;
  useTtl: boolean;
  usePartialFilterExpression: boolean;
  useCustomCollation: boolean;
  useWildcardProjection: boolean;
  useColumnstoreProjection: boolean;

  name: string;
  ttl?: string;
  partialFilterExpression?: string;
  wildcardProjection: string;
  collationString?: string;
  columnstoreProjection: string;

  serverVersion: string;

  toggleIsUnique: (isUnique: boolean) => void;
  toggleIsSparse: (isSparse: boolean) => void;

  toggleUseIndexName: (useIndexName: boolean) => void;
  toggleUseTtl: (useTtl: boolean) => void;
  toggleUsePartialFilterExpression: (
    usePartialFilterExpression: boolean
  ) => void;
  toggleUseWildcardProjection: (useWildcardProjection: boolean) => void;
  toggleUseCustomCollation: (useCustomCollation: boolean) => void;
  toggleUseColumnstoreProjection: (useColumnstoreProjection: boolean) => void;

  nameChanged: (name: string) => void;
  ttlChanged: (ttl: string) => void;
  partialFilterExpressionChanged: (partialFilterExpression: string) => void;
  wildcardProjectionChanged: (wildcardProjection: string) => void;
  collationStringChanged: (collationString: string) => void;
  columnstoreProjectionChanged: (columnstoreProjection: string) => void;

  updateFieldName: (idx: number, name: string) => void;
  updateFieldType: (idx: number, fType: string) => void;
  addField: () => void; // Plus icon.
  removeField: (idx: number) => void; // Minus icon.
  createNewIndexField: (newField: string) => void; // Create a new index name.
};

function CreateIndexForm({
  fields,
  newIndexField,
  schemaFields,

  isUnique,
  isSparse,

  useIndexName,
  useTtl,
  usePartialFilterExpression,
  useCustomCollation,
  useWildcardProjection,
  useColumnstoreProjection,

  name,
  ttl,
  partialFilterExpression,
  wildcardProjection,
  collationString,
  columnstoreProjection,

  serverVersion,

  toggleIsUnique,
  toggleIsSparse,

  toggleUseIndexName,
  toggleUseTtl,
  toggleUsePartialFilterExpression,
  toggleUseWildcardProjection,
  toggleUseCustomCollation,
  toggleUseColumnstoreProjection,

  nameChanged,
  ttlChanged,
  partialFilterExpressionChanged,
  wildcardProjectionChanged,
  collationStringChanged,
  columnstoreProjectionChanged,

  updateFieldName,
  updateFieldType,
  addField,
  removeField,
  createNewIndexField,
}: CreateIndexFormProps) {
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
            schemaFields={schemaFields}
            fields={fields}
            serverVersion={serverVersion}
            isRemovable={!(fields.length > 1)}
            updateFieldName={updateFieldName}
            updateFieldType={updateFieldType}
            addField={addField}
            removeField={removeField}
            newIndexField={newIndexField}
            createNewIndexField={createNewIndexField}
          />
        ) : null}
      </div>
      <Accordion data-testid="create-index-modal-toggle-options" text="Options">
        <div
          data-testid="create-index-modal-options"
          className={createIndexModalOptionStyles}
        >
          <UniqueIndexCheckbox
            isUnique={isUnique}
            toggleIsUnique={toggleIsUnique}
          />
          <IndexNameCollapsibleFieldSet
            useIndexName={useIndexName}
            toggleUseIndexName={toggleUseIndexName}
            indexName={name}
            nameChanged={nameChanged}
          />
          <TTLCollapsibleFieldSet
            useTtl={useTtl}
            toggleUseTtl={toggleUseTtl}
            ttl={ttl}
            ttlChanged={ttlChanged}
          />
          <PartialFilterCollapsibleFieldSet
            usePartialFilterExpression={usePartialFilterExpression}
            toggleUsePartialFilterExpression={toggleUsePartialFilterExpression}
            partialFilterExpression={partialFilterExpression}
            partialFilterExpressionChanged={partialFilterExpressionChanged}
          />
          <WildcardProjectionCollapsibleFieldSet
            useWildcardProjection={useWildcardProjection}
            toggleUseWildcardProjection={toggleUseWildcardProjection}
            wildcardProjection={wildcardProjection}
            wildcardProjectionChanged={wildcardProjectionChanged}
          />
          <CustomCollationCollapsibleFieldSet
            useCustomCollation={useCustomCollation}
            toggleUseCustomCollation={toggleUseCustomCollation}
            collationString={collationString}
            collationStringChanged={collationStringChanged}
          />
          {hasColumnstoreIndexesSupport(serverVersion) && (
            <ColumnstoreProjectionCollapsibleFieldSet
              useColumnstoreProjection={useColumnstoreProjection}
              toggleUseColumnstoreProjection={toggleUseColumnstoreProjection}
              columnstoreProjection={columnstoreProjection}
              columnstoreProjectionChanged={columnstoreProjectionChanged}
            />
          )}
          <SparseIndexCheckbox
            isSparse={isSparse}
            toggleIsSparse={toggleIsSparse}
          />
        </div>
      </Accordion>
    </>
  );
}

export { CreateIndexForm };
