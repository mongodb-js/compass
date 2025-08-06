import React, { useCallback, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../../store/reducer';
import {
  Combobox,
  FormFieldContainer,
  ComboboxOption,
  Select,
  Option,
  spacing,
  css,
  palette,
  Button,
  Icon,
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
import DMDrawerSection from './dm-drawer-section';

type RelationshipDrawerContentProps = {
  relationshipId: string;
  relationship: Relationship;
  fields: Record<string, string[][]>;
  onRelationshipUpdate: (relationship: Relationship) => void;
  onDeleteRelationshipClick: (rId: string) => void;
};

type RelationshipFormFields = {
  localCollection: string;
  localField: string;
  localCardinality: string;
  foreignCollection: string;
  foreignField: string;
  foreignCardinality: string;
};

const formFieldContainerStyles = css({
  marginBottom: spacing[400],
  marginTop: spacing[400],
  '&:first-child': {
    marginTop: 0,
  },
  '&:last-child': {
    marginBottom: 0,
  },
});

const titleBtnStyles = css({
  marginLeft: 'auto',
  maxHeight: 20, // to make sure we're matching accordion line height
});

const FIELD_DIVIDER = '~~##$$##~~';

function useRelationshipFormFields(
  relationship: Relationship,
  onRelationshipChange: (relationship: Relationship) => void
): RelationshipFormFields & {
  onFieldChange: (key: keyof RelationshipFormFields, value: string) => void;
} {
  const onRelationshipChangeRef = useRef(onRelationshipChange);
  onRelationshipChangeRef.current = onRelationshipChange;
  const [local, foreign] = relationship.relationship;
  const localCollection = local.ns ?? '';
  // Leafygreen select / combobox only supports string fields, so we stringify
  // the value for the form, and then will convert it back on update
  const localField = local.fields?.join(FIELD_DIVIDER) ?? '';
  const localCardinality = String(local.cardinality);
  const foreignCollection = foreign.ns ?? '';
  const foreignField = foreign.fields?.join(FIELD_DIVIDER) ?? '';
  const foreignCardinality = String(foreign.cardinality);
  const onFieldChange = useCallback(
    (key: keyof RelationshipFormFields, value: string) => {
      const newRelationship = cloneDeep(relationship);
      switch (key) {
        case 'localCollection':
          newRelationship.relationship[0].ns = value;
          newRelationship.relationship[0].fields = null;
          break;
        case 'localField':
          newRelationship.relationship[0].fields = value.split(FIELD_DIVIDER);
          break;
        case 'localCardinality':
          newRelationship.relationship[0].cardinality = Number(value);
          break;
        case 'foreignCollection':
          newRelationship.relationship[1].ns = value;
          newRelationship.relationship[1].fields = null;
          break;
        case 'foreignField':
          newRelationship.relationship[1].fields = value.split(FIELD_DIVIDER);
          break;
        case 'foreignCardinality':
          newRelationship.relationship[1].cardinality = Number(value);
          break;
      }
      onRelationshipChangeRef.current(newRelationship);
    },
    [relationship]
  );
  return {
    localCollection,
    localField,
    localCardinality,
    foreignCollection,
    foreignField,
    foreignCardinality,
    onFieldChange,
  };
}

const cardinalityTagStyle = css({
  color: palette.gray.base,
  fontWeight: 'bold',
});

const CardinalityLabel: React.FunctionComponent<{
  value: number;
  tag: string;
}> = ({ value, tag }) => (
  <>
    <span className={cardinalityTagStyle}>{tag}</span>&nbsp;{value}
  </>
);

const CARDINALITY_OPTIONS = [
  { tag: 'One', value: 1 },
  { tag: 'Many', value: 10 },
  { tag: 'Many', value: 100 },
  { tag: 'Many', value: 1000 },
];

const configurationContainerStyles = css({
  width: '100%',
  display: 'grid',
  gridTemplateAreas: `
    "local foreign"
  `,
  gridTemplateColumns: '1fr 1fr',
  gap: spacing[400],
  paddingTop: spacing[400],
});

const configurationLocalFieldStyles = css({
  gridArea: 'local',
});

const configurationForeignFieldStyles = css({
  gridArea: 'foreign',
});

const RelationshipDrawerContent: React.FunctionComponent<
  RelationshipDrawerContentProps
> = ({
  relationshipId,
  relationship,
  fields,
  onRelationshipUpdate,
  onDeleteRelationshipClick,
}) => {
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
  } = useRelationshipFormFields(relationship, onRelationshipUpdate);

  const localFieldOptions = useMemo(() => {
    return fields[localCollection] ?? [];
  }, [fields, localCollection]);

  const foreignFieldOptions = useMemo(() => {
    return fields[foreignCollection] ?? [];
  }, [fields, foreignCollection]);

  return (
    <div data-relationship-id={relationshipId}>
      <DMDrawerSection
        label={
          <>
            <span>Relationship properties</span>

            <Button
              variant="dangerOutline"
              leftGlyph={<Icon glyph="Trash" />}
              className={titleBtnStyles}
              size="xsmall"
              onClick={() => {
                onDeleteRelationshipClick(relationshipId);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className={configurationContainerStyles}>
          <div className={configurationLocalFieldStyles}>
            <FormFieldContainer className={formFieldContainerStyles}>
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
            </FormFieldContainer>

            <FormFieldContainer className={formFieldContainerStyles}>
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
            </FormFieldContainer>
            <FormFieldContainer className={formFieldContainerStyles}>
              <Select
                size="small"
                label="Local cardinality"
                value={localCardinality}
                onChange={(val) => {
                  if (val) {
                    onFieldChange('localCardinality', val);
                  }
                }}
              >
                {CARDINALITY_OPTIONS.map(({ tag, value }) => {
                  return (
                    <Option key={value} value={String(value)}>
                      <CardinalityLabel value={value} tag={tag} />
                    </Option>
                  );
                })}
              </Select>
            </FormFieldContainer>
          </div>

          <div className={configurationForeignFieldStyles}>
            <FormFieldContainer className={formFieldContainerStyles}>
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
            </FormFieldContainer>

            <FormFieldContainer className={formFieldContainerStyles}>
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
            </FormFieldContainer>

            <FormFieldContainer className={formFieldContainerStyles}>
              <Select
                size="small"
                label="Foreign cardinality"
                value={foreignCardinality}
                onChange={(val) => {
                  if (val) {
                    onFieldChange('foreignCardinality', val);
                  }
                }}
              >
                {CARDINALITY_OPTIONS.map(({ tag, value }) => {
                  return (
                    <Option key={value} value={String(value)}>
                      <CardinalityLabel value={value} tag={tag} />
                    </Option>
                  );
                })}
              </Select>
            </FormFieldContainer>
          </div>
        </div>
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
