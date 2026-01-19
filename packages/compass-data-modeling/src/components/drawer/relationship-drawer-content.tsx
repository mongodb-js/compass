import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../../store/reducer';
import {
  Combobox,
  ComboboxOption,
  Select,
  Option,
  spacing,
  css,
  palette,
  TextArea,
  useCurrentValueRef,
  cx,
  Icon,
  Link,
} from '@mongodb-js/compass-components';
import {
  deleteRelationship,
  getCurrentDiagramFromState,
  getRelationshipForCurrentModel,
  selectFieldsForCurrentModel,
  updateRelationship,
} from '../../store/diagram';
import toNS from 'mongodb-ns';
import type { Relationship } from '../../services/data-model-storage';
import { cloneDeep } from 'lodash';
import {
  DMDrawerSection,
  DMFormFieldContainer,
} from './drawer-section-components';
import { useChangeOnBlur } from './use-change-on-blur';
const nbsp = '\u00a0';

type RelationshipDrawerContentProps = {
  relationshipId: string;
  relationship: Relationship;
  fields: Record<string, string[][]>;
  onRelationshipUpdate: (relationship: Relationship) => void;
};

type RelationshipFormFields = {
  localCollection: string;
  localField: string;
  localCardinality: number | null;
  foreignCollection: string;
  foreignField: string;
  foreignCardinality: number | null;
  note: string;
};

type OnFieldChange = <T extends keyof RelationshipFormFields>(
  key: T,
  value: RelationshipFormFields[T]
) => void;

const FIELD_DIVIDER = '~~##$$##~~';

function useRelationshipFormFields(
  relationship: Relationship,
  onRelationshipChange: (relationship: Relationship) => void
): RelationshipFormFields & {
  onFieldChange: OnFieldChange;
} {
  const onRelationshipChangeRef = useCurrentValueRef(onRelationshipChange);
  const [local, foreign] = relationship.relationship;
  const localCollection = local.ns ?? '';
  // Leafygreen select / combobox only supports string fields, so we stringify
  // the value for the form, and then will convert it back on update
  const localField = local.fields?.join(FIELD_DIVIDER) ?? '';
  const localCardinality = local.cardinality;
  const foreignCollection = foreign.ns ?? '';
  const foreignField = foreign.fields?.join(FIELD_DIVIDER) ?? '';
  const foreignCardinality = foreign.cardinality;
  const onFieldChange: OnFieldChange = useCallback(
    (key, value) => {
      const newRelationship = cloneDeep(relationship);
      switch (key) {
        // "as string | number" because ts can't correlate value type with key type here
        case 'localCollection':
          newRelationship.relationship[0].ns = value as string;
          newRelationship.relationship[0].fields = null;
          break;
        case 'localField':
          newRelationship.relationship[0].fields = (value as string).split(
            FIELD_DIVIDER
          );
          break;
        case 'localCardinality':
          newRelationship.relationship[0].cardinality = value as number;
          break;
        case 'foreignCollection':
          newRelationship.relationship[1].ns = value as string;
          newRelationship.relationship[1].fields = null;
          break;
        case 'foreignField':
          newRelationship.relationship[1].fields = (value as string).split(
            FIELD_DIVIDER
          );
          break;
        case 'foreignCardinality':
          newRelationship.relationship[1].cardinality = value as number;
          break;
        case 'note':
          newRelationship.note = value as string;
          break;
      }
      onRelationshipChangeRef.current(newRelationship);
    },
    [onRelationshipChangeRef, relationship]
  );
  return {
    localCollection,
    localField,
    localCardinality,
    foreignCollection,
    foreignField,
    foreignCardinality,
    onFieldChange,
    note: relationship.note ?? '',
  };
}

const cardinalityLabelContainerStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  gap: spacing[100],
});
const cardinalityLabelStyles = css({
  color: palette.gray.base,
  fontWeight: 'bold',
});

const cardinalityInfoContainerStyles = css({
  marginTop: spacing[400],
  display: 'flex',
  gap: spacing[200],
});
const infoIconStyles = css({ marginTop: spacing[100] });
const cardinalitySelectStyles = css({
  // Currently LG Select does not support custom rendering for selected value
  // and it shows the label of the selected option. When user has selected
  // "Many N/A", we dont want to show "N/A" as the selected value.
  'button .hidden-cardinality-option-label': {
    display: 'none',
  },
});

const CARDINALITY_OPTIONS = [
  { tag: 'One', label: '1', value: 1 },
  { tag: 'Many', label: 'N/A', value: null },
  { tag: 'Many', label: '100', value: 100 },
  { tag: 'Many', label: '1000', value: 1000 },
  { tag: 'Many', label: '10000+', value: 10000 },
];

// Exported for tests
export const CardinalitySelect = ({
  label,
  value,
  onChange,
}: {
  value: number | null;
  label: string;
  onChange: (value: number | null) => void;
}) => {
  return (
    <Select
      size="small"
      label={label}
      value={String(value ?? 'null')}
      allowDeselect={false}
      onChange={(val) => onChange(val === 'null' ? null : Number(val))}
      className={cardinalitySelectStyles}
    >
      {CARDINALITY_OPTIONS.map(({ tag, value, label }) => (
        <Option key={String(value)} value={String(value)}>
          <div className={cardinalityLabelContainerStyles}>
            {tag}
            <span
              className={cx(
                cardinalityLabelStyles,
                // Hide N/A label in selected value display
                value === null && 'hidden-cardinality-option-label'
              )}
            >
              {label}
            </span>
          </div>
        </Option>
      ))}
    </Select>
  );
};

const configurationContainerStyles = css({
  width: '100%',
  display: 'grid',
  gridTemplateAreas: `
    "local foreign"
  `,
  gridTemplateColumns: '1fr 1fr',
  gap: spacing[400],
});

const configurationLocalFieldStyles = css({
  gridArea: 'local',
});

const configurationForeignFieldStyles = css({
  gridArea: 'foreign',
});

const RelationshipDrawerContent: React.FunctionComponent<
  RelationshipDrawerContentProps
> = ({ relationshipId, relationship, fields, onRelationshipUpdate }) => {
  const collections = useMemo(() => {
    return Object.keys(fields);
  }, [fields]);

  const {
    localCollection,
    localField,
    localCardinality,
    foreignCollection,
    foreignField,
    foreignCardinality,
    onFieldChange,
    note,
  } = useRelationshipFormFields(relationship, onRelationshipUpdate);

  const noteInputProps = useChangeOnBlur(note, (newNote) => {
    onFieldChange('note', newNote);
  });

  const localFieldOptions = useMemo(() => {
    return fields[localCollection] ?? [];
  }, [fields, localCollection]);

  const foreignFieldOptions = useMemo(() => {
    return fields[foreignCollection] ?? [];
  }, [fields, foreignCollection]);

  return (
    <div data-relationship-id={relationshipId}>
      <DMDrawerSection label="Relationship properties">
        <div className={configurationContainerStyles}>
          <div className={configurationLocalFieldStyles}>
            <DMFormFieldContainer>
              <Combobox
                size="small"
                label="Local collection"
                value={localCollection}
                onChange={(val) => {
                  if (val) {
                    onFieldChange('localCollection', val);
                  }
                }}
                multiselect={false}
                clearable={false}
              >
                {collections.map((ns) => {
                  return (
                    <ComboboxOption
                      key={ns}
                      value={ns}
                      // Database name is always the same, so we trim it
                      displayName={toNS(ns).collection}
                    ></ComboboxOption>
                  );
                })}
              </Combobox>
            </DMFormFieldContainer>

            <DMFormFieldContainer>
              <Combobox
                size="small"
                label="Local field"
                value={localField}
                onChange={(val) => {
                  if (val) {
                    onFieldChange('localField', val);
                  }
                }}
                multiselect={false}
                clearable={false}
              >
                {localFieldOptions.map((field) => {
                  return (
                    <ComboboxOption
                      key={field.join('.')}
                      value={field.join(FIELD_DIVIDER)}
                      displayName={field.join('.')}
                    ></ComboboxOption>
                  );
                })}
              </Combobox>
            </DMFormFieldContainer>
            <DMFormFieldContainer>
              <CardinalitySelect
                label="Local cardinality"
                value={localCardinality}
                onChange={(val) => onFieldChange('localCardinality', val)}
              />
            </DMFormFieldContainer>
          </div>

          <div className={configurationForeignFieldStyles}>
            <DMFormFieldContainer>
              <Combobox
                size="small"
                label="Foreign collection"
                value={foreignCollection}
                onChange={(val) => {
                  if (val) {
                    onFieldChange('foreignCollection', val);
                  }
                }}
                multiselect={false}
                clearable={false}
              >
                {collections.map((ns) => {
                  return (
                    <ComboboxOption
                      key={ns}
                      value={ns}
                      // Database name is always the same, so we trim it
                      displayName={toNS(ns).collection}
                    ></ComboboxOption>
                  );
                })}
              </Combobox>
            </DMFormFieldContainer>

            <DMFormFieldContainer>
              <Combobox
                size="small"
                label="Foreign field"
                value={foreignField}
                onChange={(val) => {
                  if (val) {
                    onFieldChange('foreignField', val);
                  }
                }}
                multiselect={false}
                clearable={false}
              >
                {foreignFieldOptions.map((field) => {
                  return (
                    <ComboboxOption
                      key={field.join('.')}
                      value={field.join(FIELD_DIVIDER)}
                      displayName={field.join('.')}
                    ></ComboboxOption>
                  );
                })}
              </Combobox>
            </DMFormFieldContainer>

            <DMFormFieldContainer>
              <CardinalitySelect
                label="Foreign cardinality"
                value={foreignCardinality}
                onChange={(val) => onFieldChange('foreignCardinality', val)}
              />
            </DMFormFieldContainer>
          </div>
        </div>
        <div className={cardinalityInfoContainerStyles}>
          <Icon glyph="InfoWithCircle" className={infoIconStyles} />
          <span>
            Relationship cardinality can inform whether you embed or reference.
            {nbsp}
            <Link href="https://www.mongodb.com/docs/manual/applications/data-models-relationships">
              Learn more
            </Link>
          </span>
        </div>
      </DMDrawerSection>

      <DMDrawerSection label="Notes">
        <DMFormFieldContainer>
          <TextArea label="" aria-label="Notes" {...noteInputProps}></TextArea>
        </DMFormFieldContainer>
      </DMDrawerSection>
    </div>
  );
};

export default connect(
  (state: DataModelingState, ownProps: { relationshipId: string }) => {
    const diagram = getCurrentDiagramFromState(state);
    const relationship = getRelationshipForCurrentModel(
      diagram.edits,
      ownProps.relationshipId
    );
    if (!relationship) {
      throw new Error(
        `Can not find relationship with ${ownProps.relationshipId}`
      );
    }
    return {
      relationship,
      fields: selectFieldsForCurrentModel(diagram.edits),
    };
  },
  {
    onRelationshipUpdate: updateRelationship,
    onDeleteRelationshipClick: deleteRelationship,
  }
)(RelationshipDrawerContent);
