import React, { useCallback, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import {
  Button,
  Combobox,
  FormFieldContainer,
  H3,
  ComboboxOption,
  Select,
  Option,
} from '@mongodb-js/compass-components';
import {
  deleteRelationship,
  getCurrentDiagramFromState,
  selectFieldsForCurrentModel,
  selectRelationshipForCurrentModel,
  updateRelationship,
} from '../store/diagram';
import toNS from 'mongodb-ns';
import type { Relationship } from '../services/data-model-storage';
import { cloneDeep } from 'lodash';

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
  foreignCollection: string;
  foreignField: string;
  localCardinality: string;
  foreignCardinality: string;
};

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

const CARDINALITY_OPTIONS = [1, 10, 100, 1000];

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
      <H3>Edit Relationship</H3>

      <FormFieldContainer>
        <Combobox
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

      <FormFieldContainer>
        <Combobox
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

      <FormFieldContainer>
        <Combobox
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

      <FormFieldContainer>
        <Combobox
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

      <FormFieldContainer>
        <Select
          label="Local cardinality"
          value={localCardinality}
          onChange={(val) => {
            if (val) {
              onFieldChange('localCardinality', val);
            }
          }}
        >
          {CARDINALITY_OPTIONS.map((option) => {
            return (
              <Option key={option} value={String(option)}>
                {option}
              </Option>
            );
          })}
        </Select>
      </FormFieldContainer>

      <FormFieldContainer>
        <Select
          label="Foreign cardinality"
          value={foreignCardinality}
          onChange={(val) => {
            if (val) {
              onFieldChange('foreignCardinality', val);
            }
          }}
        >
          {CARDINALITY_OPTIONS.map((option) => {
            return (
              <Option key={option} value={String(option)}>
                {option}
              </Option>
            );
          })}
        </Select>
      </FormFieldContainer>

      <FormFieldContainer>
        <Button
          onClick={() => {
            onDeleteRelationshipClick(relationshipId);
          }}
        >
          Delete
        </Button>
      </FormFieldContainer>
    </div>
  );
};

export default connect(
  (state: DataModelingState, ownProps: { relationshipId: string }) => {
    const diagram = getCurrentDiagramFromState(state);
    const relationship = selectRelationshipForCurrentModel(
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
