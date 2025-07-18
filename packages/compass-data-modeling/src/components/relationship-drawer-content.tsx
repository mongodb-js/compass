import React, { useMemo } from 'react';
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
import type { RelationshipFormFields } from '../store/side-panel';
import {
  cancelRelationshipEditing,
  changeRelationshipFormField,
  submitRelationshipEdit,
} from '../store/side-panel';
import {
  deleteRelationship,
  getCurrentDiagramFromState,
  selectFieldsForCurrentModel,
} from '../store/diagram';
import toNS from 'mongodb-ns';

type RelationshipDrawerContentProps = {
  relationshipId: string;
  localCollection: string;
  localField: string;
  foreignCollection: string;
  foreignField: string;
  cardinality: string;
  fields: Record<string, string[]>;
  onFormFieldChange: (field: RelationshipFormFields, value: string) => void;
  onDeleteRelationsClick: (rId: string) => void;
  onSubmitFormClick: () => void;
  onCancelEditClick: () => void;
};

const CARDINALITY_OPTIONS = [
  { label: 'One to one', value: 'one-to-one' },
  { label: 'One to many', value: 'one-to-many' },
  { label: 'Many to one', value: 'many-to-one' },
  { label: 'Many to many', value: 'many-to-many' },
];

const RelationshipDrawerContent: React.FunctionComponent<
  RelationshipDrawerContentProps
> = ({
  relationshipId,
  localCollection,
  localField,
  foreignCollection,
  foreignField,
  cardinality,
  fields,
  onFormFieldChange,
  onDeleteRelationsClick,
  onSubmitFormClick,
  onCancelEditClick,
}) => {
  const collections = useMemo(() => {
    return Object.keys(fields);
  }, [fields]);

  const localFieldOptions = useMemo(() => {
    return fields[localCollection] ?? [];
  }, [fields, localCollection]);

  const foreignFieldOptions = useMemo(() => {
    return fields[foreignCollection] ?? [];
  }, [fields, foreignCollection]);

  const isValid = Boolean(
    localCollection &&
      localField &&
      foreignCollection &&
      foreignField &&
      cardinality
  );

  return (
    <div data-relationship-id={relationshipId}>
      <H3>Edit Relationship</H3>

      <FormFieldContainer>
        <Combobox
          label="Local collection"
          value={localCollection}
          onChange={(val) => {
            if (val) {
              onFormFieldChange('localCollection', val);
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
              onFormFieldChange('localField', val);
            }
          }}
          multiselect={false}
          clearable={false}
        >
          {localFieldOptions.map((field) => {
            return <ComboboxOption key={field} value={field}></ComboboxOption>;
          })}
        </Combobox>
      </FormFieldContainer>

      <FormFieldContainer>
        <Combobox
          label="Foreign collection"
          value={foreignCollection}
          onChange={(val) => {
            if (val) {
              onFormFieldChange('foreignCollection', val);
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
              onFormFieldChange('foreignField', val);
            }
          }}
          multiselect={false}
          clearable={false}
        >
          {foreignFieldOptions.map((field) => {
            return <ComboboxOption key={field} value={field}></ComboboxOption>;
          })}
        </Combobox>
      </FormFieldContainer>

      <FormFieldContainer>
        <Select
          label="Cardinality"
          value={cardinality}
          onChange={(val) => {
            if (val) {
              onFormFieldChange('cardinality', val);
            }
          }}
        >
          {CARDINALITY_OPTIONS.map((option) => {
            return (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            );
          })}
        </Select>
      </FormFieldContainer>

      <div>
        <Button
          onClick={() => {
            onDeleteRelationsClick(relationshipId);
          }}
        >
          Delete
        </Button>
        <Button disabled={!isValid} onClick={onSubmitFormClick}>
          Save
        </Button>
        <Button onClick={onCancelEditClick}>Cancel</Button>
      </div>
    </div>
  );
};

export default connect(
  (state: DataModelingState) => {
    if (state.sidePanel.viewType !== 'relationship-editing') {
      throw new Error('Unexpected state');
    }
    return {
      ...state.sidePanel.relationshipFormState,
      fields: selectFieldsForCurrentModel(
        getCurrentDiagramFromState(state).edits
      ),
    };
  },
  {
    onFormFieldChange: changeRelationshipFormField,
    onDeleteRelationsClick: deleteRelationship,
    onSubmitFormClick: submitRelationshipEdit,
    onCancelEditClick: cancelRelationshipEditing,
  }
)(RelationshipDrawerContent);
