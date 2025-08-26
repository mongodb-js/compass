import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type {
  FieldPath,
  Relationship,
} from '../../services/data-model-storage';
import {
  Combobox,
  ComboboxOption,
  TextInput,
} from '@mongodb-js/compass-components';
import { BSONType } from 'mongodb';
import {
  createNewRelationship,
  deleteRelationship,
  selectCurrentModelFromState,
  selectRelationship,
} from '../../store/diagram';
import type { DataModelingState } from '../../store/reducer';
import {
  DMDrawerSection,
  DMFormFieldContainer,
} from './drawer-section-components';
import { useChangeOnBlur } from './use-change-on-blur';
import { RelationshipsSection } from './relationships-section';
import { getFieldFromSchema } from '../../utils/schema-traversal';
import { areFieldPathsEqual } from '../../utils/utils';

type FieldDrawerContentProps = {
  namespace: string;
  fieldPath: FieldPath;
  fieldPaths: FieldPath[];
  types: string[];
  relationships: Relationship[];
  onCreateNewRelationshipClick: ({
    localNamespace,
    localFields,
  }: {
    localNamespace: string;
    localFields: FieldPath;
  }) => void;
  onEditRelationshipClick: (rId: string) => void;
  onDeleteRelationshipClick: (rId: string) => void;
  onRenameField: (
    namespace: string,
    fromFieldPath: FieldPath,
    toFieldPath: FieldPath
  ) => void;
  onChangeFieldType: (
    namespace: string,
    fieldPath: FieldPath,
    fromBsonType: string | string[],
    toBsonType: string | string[]
  ) => void;
};

const BSON_TYPES = Object.keys(BSONType);

export function getIsFieldNameValid(
  currentFieldPath: FieldPath,
  existingFields: FieldPath[],
  newName: string
): {
  isValid: boolean;
  errorMessage?: string;
} {
  const trimmedName = newName.trim();
  if (!trimmedName.length) {
    return {
      isValid: false,
      errorMessage: 'Field name cannot be empty.',
    };
  }

  const fieldsNamesWithoutCurrent = existingFields
    .filter((fieldPath) => !areFieldPathsEqual(fieldPath, currentFieldPath))
    .map((fieldPath) => fieldPath[fieldPath.length - 1]);

  const isDuplicate = fieldsNamesWithoutCurrent.some(
    (fieldName) => fieldName === trimmedName
  );

  return {
    isValid: !isDuplicate,
    errorMessage: isDuplicate ? 'Field already exists.' : undefined,
  };
}

const FieldDrawerContent: React.FunctionComponent<FieldDrawerContentProps> = ({
  namespace,
  fieldPath,
  fieldPaths,
  types,
  relationships,
  onCreateNewRelationshipClick,
  onEditRelationshipClick,
  onDeleteRelationshipClick,
  onRenameField,
  onChangeFieldType,
}) => {
  const { value: fieldName, ...nameInputProps } = useChangeOnBlur(
    fieldPath[fieldPath.length - 1],
    (fieldName) => {
      const trimmedName = fieldName.trim();
      if (trimmedName === fieldPath[fieldPath.length - 1]) {
        return;
      }
      if (!isFieldNameValid) {
        return;
      }
      onRenameField(namespace, fieldPath, [
        ...fieldPath.slice(0, fieldPath.length - 1),
        trimmedName,
      ]);
    }
  );

  const { isValid: isFieldNameValid, errorMessage: fieldNameEditErrorMessage } =
    useMemo(
      () => getIsFieldNameValid(fieldPath, fieldPaths, fieldName),
      [fieldPath, fieldPaths, fieldName]
    );

  const handleTypeChange = (newTypes: string | string[]) => {
    onChangeFieldType(namespace, fieldPath, types, newTypes);
  };

  return (
    <>
      <DMDrawerSection label="Field properties">
        <DMFormFieldContainer>
          <TextInput
            label="Field name"
            disabled={true} // TODO: enable when field renaming is implemented
            data-testid="data-model-collection-drawer-name-input"
            sizeVariant="small"
            value={fieldName}
            {...nameInputProps}
            state={isFieldNameValid ? undefined : 'error'}
            errorMessage={fieldNameEditErrorMessage}
          />
        </DMFormFieldContainer>

        <DMFormFieldContainer>
          <Combobox
            data-testid="lg-combobox-datatype"
            label="Datatype"
            aria-label="Datatype"
            disabled={true} // TODO(COMPASS-9659): enable when field type change is implemented
            value={types}
            size="small"
            multiselect={true}
            clearable={false}
            onChange={handleTypeChange}
          >
            {BSON_TYPES.map((type) => (
              <ComboboxOption key={type} value={type} />
            ))}
          </Combobox>
        </DMFormFieldContainer>
      </DMDrawerSection>

      <RelationshipsSection
        relationships={relationships}
        emptyMessage="This field does not have any relationships yet."
        onCreateNewRelationshipClick={() => {
          onCreateNewRelationshipClick({
            localNamespace: namespace,
            localFields: fieldPath,
          });
        }}
        onEditRelationshipClick={onEditRelationshipClick}
        onDeleteRelationshipClick={onDeleteRelationshipClick}
      />
    </>
  );
};

export default connect(
  (
    state: DataModelingState,
    ownProps: { namespace: string; fieldPath: FieldPath }
  ) => {
    const model = selectCurrentModelFromState(state);
    return {
      types:
        getFieldFromSchema({
          jsonSchema:
            model.collections.find(
              (collection) => collection.ns === ownProps.namespace
            )?.jsonSchema ?? {},
          fieldPath: ownProps.fieldPath,
        })?.fieldTypes ?? [],
      fieldPaths: [], // TODO(COMPASS-9659): get existing field paths
      relationships: model.relationships.filter((r) => {
        const [local, foreign] = r.relationship;
        return (
          (local.ns === ownProps.namespace &&
            local.fields &&
            areFieldPathsEqual(local.fields, ownProps.fieldPath)) ||
          (foreign.ns === ownProps.namespace &&
            foreign.fields &&
            areFieldPathsEqual(foreign.fields, ownProps.fieldPath))
        );
      }),
    };
  },
  {
    onCreateNewRelationshipClick: createNewRelationship,
    onEditRelationshipClick: selectRelationship,
    onDeleteRelationshipClick: deleteRelationship,
    onRenameField: () => {}, // TODO(COMPASS-9659): renameField,
    onChangeFieldType: () => {}, // TODO(COMPASS-9659): updateFieldSchema,
  }
)(FieldDrawerContent);
