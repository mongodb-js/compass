import React, { useMemo } from 'react';
import {
  css,
  spacing,
  Accordion,
  Body,
  RadioBoxGroup,
  RadioBox,
} from '@mongodb-js/compass-components';
import type { Field, Tab } from '../../modules/create-index';
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

const createIndexModalFlowsStyles = css({
  marginBottom: spacing[600],
});

export type CreateIndexFormProps = {
  namespace: string;
  fields: Field[];
  serverVersion: string;
  currentTab: Tab;
  onSelectFieldNameClick: (idx: number, name: string) => void;
  onSelectFieldTypeClick: (idx: number, fType: string) => void;
  onAddFieldClick: () => void; // Plus icon.
  onRemoveFieldClick: (idx: number) => void; // Minus icon.
  onTabClick: (tab: Tab) => void;
  showIndexesGuidanceVariant?: boolean;
};

function CreateIndexForm({
  namespace,
  fields,
  serverVersion,
  currentTab,
  onSelectFieldNameClick,
  onSelectFieldTypeClick,
  onAddFieldClick,
  onRemoveFieldClick,
  onTabClick,
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
        {showIndexesGuidanceVariant ? (
          <RadioBoxGroup
            aria-labelledby="index-flows"
            data-testid="create-index-form-flows"
            id="create-index-form-flows"
            onChange={(e) => {
              onTabClick(e.target.value as Tab);
            }}
            value={currentTab}
            className={createIndexModalFlowsStyles}
          >
            <RadioBox id="index-flow" value={'IndexFlow'}>
              Start with an Index
            </RadioBox>
            <RadioBox id="query-flow" value={'QueryFlow'}>
              Start with a Query
            </RadioBox>
          </RadioBoxGroup>
        ) : (
          <Body weight="medium" className={indexFieldsHeaderStyles}>
            Index fields
          </Body>
        )}

        {/* Only show the fields if user is in the Start with an index flow or if they're in the control */}
        {fields.length > 0 &&
        (showIndexesGuidanceVariant ? currentTab === 'IndexFlow' : true) ? (
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
