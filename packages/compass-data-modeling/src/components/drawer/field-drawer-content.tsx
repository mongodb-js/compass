import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type {
  FieldPath,
  FieldSchema,
  Relationship,
} from '../../services/data-model-storage';
import { TextInput } from '@mongodb-js/compass-components';
import toNS from 'mongodb-ns';
import {
  createNewRelationship,
  deleteRelationship,
  renameField,
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

type FieldDrawerContentProps = {
  namespace: string;
  fieldPath: FieldPath;
  fieldPaths: FieldPath[];
  jsonSchema: FieldSchema;
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
    fromBsonType: string,
    toBsonType: string
  ) => void;
};

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
    .filter(
      (fieldPath) =>
        JSON.stringify(fieldPath) !== JSON.stringify(currentFieldPath)
    )
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
  jsonSchema,
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
      </DMDrawerSection>

      <RelationshipsSection
        relationships={relationships}
        emptyMessage="This field does not have any relationships yet."
        getRelationshipLabel={([local, foreign]) => {
          const labelField =
            local.ns === namespace &&
            JSON.stringify(local.fields) === JSON.stringify(fieldPath)
              ? foreign
              : local;
          return [
            labelField.ns ? toNS(labelField.ns).collection : '',
            labelField.fields?.join('.'),
          ].join('.');
        }}
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
      jsonSchema: {}, // TODO get field schema
      fieldPaths: [], // TODO get field paths
      relationships: model.relationships.filter((r) => {
        const [local, foreign] = r.relationship;
        return (
          (local.ns === ownProps.namespace &&
            JSON.stringify(local.fields) ===
              JSON.stringify(ownProps.fieldPath)) ||
          (foreign.ns === ownProps.namespace &&
            JSON.stringify(foreign.fields) ===
              JSON.stringify(ownProps.fieldPath))
        );
      }),
    };
  },
  {
    onCreateNewRelationshipClick: createNewRelationship,
    onEditRelationshipClick: selectRelationship,
    onDeleteRelationshipClick: deleteRelationship,
    onRenameField: renameField,
    onChangeFieldType: () => {}, // TODO: updateFieldSchema,
  }
)(FieldDrawerContent);
