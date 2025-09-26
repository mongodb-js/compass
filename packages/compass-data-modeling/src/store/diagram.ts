import type { Reducer } from 'redux';
import { UUID } from 'bson';
import { isAction } from './util';
import type {
  DataModelCollection,
  EditAction,
  FieldPath,
  Relationship,
} from '../services/data-model-storage';
import {
  validateEdit,
  type Edit,
  type MongoDBDataModelDescription,
  type StaticModel,
} from '../services/data-model-storage';
import { AnalysisProcessActionTypes } from './analysis-process';
import { memoize } from 'lodash';
import type { DataModelingState, DataModelingThunkAction } from './reducer';
import {
  openToast,
  showConfirmation,
  showPrompt,
} from '@mongodb-js/compass-components';
import {
  getDiagramContentsFromFile,
  getDiagramName,
} from '../services/open-and-download-diagram';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import { getCoordinatesForNewNode } from '@mongodb-js/diagramming';
import { collectionToBaseNodeForLayout } from '../utils/nodes-and-edges';
import toNS from 'mongodb-ns';
import {
  getFieldFromSchema,
  getSchemaWithNewTypes,
  traverseSchema,
} from '../utils/schema-traversal';
import { applyEdit as _applyEdit } from './apply-edit';
import { getNewUnusedFieldName } from '../utils/schema';

function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return Array.isArray(arr) && arr.length > 0;
}

export type SelectedItems =
  | {
      type: 'collection' | 'relationship';
      id: string;
    }
  | {
      type: 'field';
      namespace: string;
      fieldPath: FieldPath;
    };

export type DiagramState =
  | (Omit<MongoDBDataModelDescription, 'edits'> & {
      edits: {
        prev: Edit[][];
        current: [Edit, ...Edit[]];
        next: Edit[][];
      };
      editErrors?: string[];
      selectedItems: SelectedItems | null;
      isNewlyCreated: boolean;
      draftCollection?: string;
    })
  | null; // null when no diagram is currently open

export enum DiagramActionTypes {
  OPEN_DIAGRAM = 'data-modeling/diagram/OPEN_DIAGRAM',
  DELETE_DIAGRAM = 'data-modeling/diagram/DELETE_DIAGRAM',
  RENAME_DIAGRAM = 'data-modeling/diagram/RENAME_DIAGRAM',
  APPLY_INITIAL_LAYOUT = 'data-modeling/diagram/APPLY_INITIAL_LAYOUT',
  APPLY_EDIT = 'data-modeling/diagram/APPLY_EDIT',
  APPLY_EDIT_FAILED = 'data-modeling/diagram/APPLY_EDIT_FAILED',
  UNDO_EDIT = 'data-modeling/diagram/UNDO_EDIT',
  REDO_EDIT = 'data-modeling/diagram/REDO_EDIT',
  COLLECTION_SELECTED = 'data-modeling/diagram/COLLECTION_SELECTED',
  RELATIONSHIP_SELECTED = 'data-modeling/diagram/RELATIONSHIP_SELECTED',
  FIELD_SELECTED = 'data-modeling/diagram/FIELD_SELECTED',
  DIAGRAM_BACKGROUND_SELECTED = 'data-modeling/diagram/DIAGRAM_BACKGROUND_SELECTED',
}

export type OpenDiagramAction = {
  type: DiagramActionTypes.OPEN_DIAGRAM;
  diagram: MongoDBDataModelDescription;
};

export type DeleteDiagramAction = {
  type: DiagramActionTypes.DELETE_DIAGRAM;
  isCurrent: boolean; // technically a derived state, but we don't have access to this in some slices
};

export type RenameDiagramAction = {
  type: DiagramActionTypes.RENAME_DIAGRAM;
  id: string;
  name: string;
};

export type ApplyEditAction = {
  type: DiagramActionTypes.APPLY_EDIT;
  edit: Edit;
};

export type ApplyEditFailedAction = {
  type: DiagramActionTypes.APPLY_EDIT_FAILED;
  errors: string[];
};

export type UndoEditAction = {
  type: DiagramActionTypes.UNDO_EDIT;
};

export type RedoEditAction = {
  type: DiagramActionTypes.REDO_EDIT;
};

export type CollectionSelectedAction = {
  type: DiagramActionTypes.COLLECTION_SELECTED;
  namespace: string;
};

export type RelationSelectedAction = {
  type: DiagramActionTypes.RELATIONSHIP_SELECTED;
  relationshipId: string;
};

export type FieldSelectedAction = {
  type: DiagramActionTypes.FIELD_SELECTED;
  namespace: string;
  fieldPath: FieldPath;
};

export type DiagramBackgroundSelectedAction = {
  type: DiagramActionTypes.DIAGRAM_BACKGROUND_SELECTED;
};

export type DiagramActions =
  | OpenDiagramAction
  | DeleteDiagramAction
  | RenameDiagramAction
  | ApplyEditAction
  | ApplyEditFailedAction
  | UndoEditAction
  | RedoEditAction
  | CollectionSelectedAction
  | RelationSelectedAction
  | FieldSelectedAction
  | DiagramBackgroundSelectedAction;

const INITIAL_STATE: DiagramState = null;

export const diagramReducer: Reducer<DiagramState> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction(action, DiagramActionTypes.OPEN_DIAGRAM)) {
    const current = action.diagram.edits;
    const prev = current.map((_item, index, arr) => arr.slice(0, index + 1));
    prev.shift(); // Remove the first item, which is initial SetModel and there's no previous edit for it.
    return {
      ...action.diagram,
      isNewlyCreated: false,
      edits: {
        prev,
        current,
        next: [],
      },
      selectedItems: null,
    };
  }

  if (isAction(action, AnalysisProcessActionTypes.ANALYSIS_FINISHED)) {
    return {
      id: new UUID().toString(),
      isNewlyCreated: true,
      name: action.name,
      connectionId: action.connectionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      edits: {
        prev: [],
        current: [
          {
            type: 'SetModel',
            id: new UUID().toString(),
            timestamp: new Date().toISOString(),
            model: {
              collections: action.collections.map((collection) => ({
                ns: collection.ns,
                jsonSchema: collection.schema,
                displayPosition: [collection.position.x, collection.position.y],
                indexes: [],
                shardKey: undefined,
              })),
              relationships: action.relations,
            },
          },
        ],
        next: [],
      },
      selectedItems: null,
    };
  }

  // All actions below are only applicable when diagram is open
  if (!state) {
    return state;
  }

  if (isAction(action, DiagramActionTypes.RENAME_DIAGRAM)) {
    return {
      ...state,
      name: action.name,
      updatedAt: new Date().toISOString(),
    };
  }
  if (
    isAction(action, DiagramActionTypes.APPLY_EDIT) &&
    state.draftCollection &&
    action.edit.type === 'RenameCollection'
  ) {
    return {
      ...state,
      edits: getEditsAfterDraftCollectionNamed(
        state.edits,
        state.draftCollection,
        action.edit.toNS
      ),
      editErrors: undefined,
      updatedAt: new Date().toISOString(),
      selectedItems: {
        type: 'collection',
        id: action.edit.toNS,
      },
      draftCollection: undefined,
    };
  }
  if (isAction(action, DiagramActionTypes.APPLY_EDIT)) {
    return {
      ...state,
      edits: {
        prev: [...state.edits.prev, state.edits.current],
        current: [...state.edits.current, action.edit] as [Edit, ...Edit[]],
        next: [],
      },
      editErrors: undefined,
      updatedAt: new Date().toISOString(),
      selectedItems: updateSelectedItemsFromAppliedEdit(
        state.selectedItems,
        action.edit
      ),
      draftCollection:
        action.edit.type === 'AddCollection' ? action.edit.ns : undefined,
    };
  }
  if (isAction(action, DiagramActionTypes.APPLY_EDIT_FAILED)) {
    return {
      ...state,
      editErrors: action.errors,
    };
  }
  if (isAction(action, DiagramActionTypes.UNDO_EDIT)) {
    const newCurrent = state.edits.prev.pop() || [];
    if (!isNonEmptyArray(newCurrent)) {
      return state;
    }
    return {
      ...state,
      edits: {
        prev: [...state.edits.prev],
        current: newCurrent,
        next: [...state.edits.next, state.edits.current],
      },
      updatedAt: new Date().toISOString(),
    };
  }
  if (isAction(action, DiagramActionTypes.REDO_EDIT)) {
    const newCurrent = state.edits.next.pop() || [];
    if (!isNonEmptyArray(newCurrent)) {
      return state;
    }
    return {
      ...state,
      edits: {
        prev: [...state.edits.prev, state.edits.current],
        current: newCurrent,
        next: [...state.edits.next],
      },
      updatedAt: new Date().toISOString(),
    };
  }
  if (isAction(action, DiagramActionTypes.COLLECTION_SELECTED)) {
    return {
      ...state,
      selectedItems: { type: 'collection', id: action.namespace },
    };
  }
  if (isAction(action, DiagramActionTypes.RELATIONSHIP_SELECTED)) {
    return {
      ...state,
      selectedItems: {
        type: 'relationship',
        id: action.relationshipId,
      },
    };
  }
  if (isAction(action, DiagramActionTypes.FIELD_SELECTED)) {
    return {
      ...state,
      selectedItems: {
        type: 'field',
        namespace: action.namespace,
        fieldPath: action.fieldPath,
      },
    };
  }
  if (isAction(action, DiagramActionTypes.DIAGRAM_BACKGROUND_SELECTED)) {
    return {
      ...state,
      selectedItems: null,
    };
  }
  return state;
};

/**
 * When the collection is created, it gets a draft name
 * If the user renames it, we update the addCollection edit
 * instead of appending a renameCollection edit, for cleaner history.
 * @param edits
 * @param draftNamespace
 * @param newNamespace
 * @returns
 */
const getEditsAfterDraftCollectionNamed = (
  edits: NonNullable<DiagramState>['edits'],
  draftNamespace: string,
  newNamespace: string
) => {
  if (draftNamespace === newNamespace) {
    return edits;
  }

  const { current } = edits;
  const originalEditIndex = current.findIndex(
    (edit) => edit.type === 'AddCollection' && edit.ns === draftNamespace
  );
  const newEdit = {
    ...current[originalEditIndex],
    ns: newNamespace,
  };
  return {
    prev: edits.prev,
    current: [
      ...current.slice(0, originalEditIndex),
      newEdit,
      ...current.slice(originalEditIndex + 1),
    ] as [Edit, ...Edit[]],
    next: [],
  };
};

/**
 * When an edit impacts the selected item we sometimes need to update
 * the selection to reflect that, for instance when renaming a
 * collection we update the selection `id` to the new name.
 */
const updateSelectedItemsFromAppliedEdit = (
  currentSelection: SelectedItems | null,
  edit: Edit
): SelectedItems | null => {
  switch (edit.type) {
    case 'RenameCollection': {
      if (!currentSelection) {
        return currentSelection;
      }
      if (
        currentSelection?.type === 'collection' &&
        currentSelection.id === edit.fromNS
      ) {
        return {
          type: 'collection',
          id: edit.toNS,
        };
      }
      break;
    }
    case 'AddCollection': {
      return {
        type: 'collection',
        id: edit.ns,
      };
    }
    case 'RenameField': {
      return {
        type: 'field',
        namespace: edit.ns,
        fieldPath: [
          ...edit.field.slice(0, edit.field.length - 1),
          edit.newName,
        ],
      };
    }
    case 'AddField': {
      return {
        type: 'field',
        namespace: edit.ns,
        fieldPath: edit.field,
      };
    }
  }

  return currentSelection;
};

export function selectCollection(namespace: string): CollectionSelectedAction {
  return { type: DiagramActionTypes.COLLECTION_SELECTED, namespace };
}

export function selectRelationship(
  relationshipId: string
): DataModelingThunkAction<void, RelationSelectedAction> {
  return (dispatch, getState, { track }) => {
    dispatch({
      type: DiagramActionTypes.RELATIONSHIP_SELECTED,
      relationshipId,
    });
    track('Data Modeling Relationship Form Opened', {});
  };
}

export function selectField(
  namespace: string,
  fieldPath: FieldPath
): FieldSelectedAction {
  return {
    type: DiagramActionTypes.FIELD_SELECTED,
    namespace,
    fieldPath,
  };
}

export function selectBackground(): DiagramBackgroundSelectedAction {
  return {
    type: DiagramActionTypes.DIAGRAM_BACKGROUND_SELECTED,
  };
}

export function createNewRelationship({
  localNamespace,
  foreignNamespace = null,
  localFields = null,
  foreignFields = null,
}: {
  localNamespace: string;
  foreignNamespace?: string | null;
  localFields?: FieldPath | null;
  foreignFields?: FieldPath | null;
}): DataModelingThunkAction<void, RelationSelectedAction> {
  return (dispatch, getState, { track }) => {
    const relationshipId = new UUID().toString();
    const currentNumberOfRelationships = getCurrentNumberOfRelationships(
      getState()
    );
    dispatch(
      applyEdit({
        type: 'AddRelationship',
        relationship: {
          id: relationshipId,
          relationship: [
            { ns: localNamespace, cardinality: 1, fields: localFields },
            { ns: foreignNamespace, cardinality: 1, fields: foreignFields },
          ],
          isInferred: false,
        },
      })
    );
    dispatch({
      type: DiagramActionTypes.RELATIONSHIP_SELECTED,
      relationshipId,
    });
    track('Data Modeling Relationship Added', {
      num_relationships: currentNumberOfRelationships + 1,
    });
  };
}

export function undoEdit(): DataModelingThunkAction<void, UndoEditAction> {
  return (dispatch, getState, { dataModelStorage }) => {
    dispatch({ type: DiagramActionTypes.UNDO_EDIT });
    void dataModelStorage.save(getCurrentDiagramFromState(getState()));
  };
}

export function redoEdit(): DataModelingThunkAction<void, RedoEditAction> {
  return (dispatch, getState, { dataModelStorage }) => {
    dispatch({ type: DiagramActionTypes.REDO_EDIT });
    void dataModelStorage.save(getCurrentDiagramFromState(getState()));
  };
}

export function addNewFieldToCollection(
  ns: string
): DataModelingThunkAction<void, ApplyEditAction | ApplyEditFailedAction> {
  return (dispatch, getState) => {
    const modelState = selectCurrentModelFromState(getState());

    const collection = modelState.collections.find((c) => c.ns === ns);
    if (!collection) {
      throw new Error('Collection to add field to not found');
    }

    const edit: Omit<
      Extract<Edit, { type: 'AddField' }>,
      'id' | 'timestamp'
    > = {
      type: 'AddField',
      ns,
      // Use the first unique field name we can use.
      field: [getNewUnusedFieldName(collection.jsonSchema)],
      jsonSchema: {
        bsonType: 'string',
      },
    };

    return dispatch(applyEdit(edit));
  };
}

export function moveCollection(
  ns: string,
  newPosition: [number, number]
): DataModelingThunkAction<void, ApplyEditAction | ApplyEditFailedAction> {
  const edit: Omit<
    Extract<Edit, { type: 'MoveCollection' }>,
    'id' | 'timestamp'
  > = {
    type: 'MoveCollection',
    ns,
    newPosition,
  };
  return applyEdit(edit);
}

export function renameCollection(
  fromNS: string,
  toNS: string
): DataModelingThunkAction<
  void,
  ApplyEditAction | ApplyEditFailedAction | CollectionSelectedAction
> {
  const edit: Omit<
    Extract<Edit, { type: 'RenameCollection' }>,
    'id' | 'timestamp'
  > = {
    type: 'RenameCollection',
    fromNS,
    toNS,
  };

  return applyEdit(edit);
}

export function applyEdit(
  rawEdit: EditAction
): DataModelingThunkAction<boolean, ApplyEditAction | ApplyEditFailedAction> {
  return (dispatch, getState, { dataModelStorage }) => {
    const edit = {
      ...rawEdit,
      id: new UUID().toString(),
      timestamp: new Date().toISOString(),
    };
    const { result: isValid, errors } = validateEdit(edit);
    if (!isValid) {
      dispatch({
        type: DiagramActionTypes.APPLY_EDIT_FAILED,
        errors,
      });
      return isValid;
    }
    dispatch({
      type: DiagramActionTypes.APPLY_EDIT,
      edit,
    });
    void dataModelStorage.save(getCurrentDiagramFromState(getState()));
    return isValid;
  };
}

export function openDiagram(
  diagram: MongoDBDataModelDescription
): OpenDiagramAction {
  return { type: DiagramActionTypes.OPEN_DIAGRAM, diagram };
}

export function deleteDiagram(
  id: string
): DataModelingThunkAction<Promise<void>, DeleteDiagramAction> {
  return async (dispatch, getState, { dataModelStorage }) => {
    const confirmed = await showConfirmation({
      title: 'Are you sure you want to delete this diagram?',
      description: 'This action can not be undone',
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }
    const isCurrent = getState().diagram?.id === id;
    dispatch({ type: DiagramActionTypes.DELETE_DIAGRAM, isCurrent });
    void dataModelStorage.delete(id);
  };
}

export function renameDiagram(
  id: string // TODO maybe pass the whole thing here, we always have it when calling this, then we don't need to re-load storage
): DataModelingThunkAction<Promise<void>, RenameDiagramAction> {
  return async (dispatch, getState, { dataModelStorage }) => {
    try {
      const diagram = await dataModelStorage.load(id);
      if (!diagram) {
        return;
      }
      const newName = await showPrompt({
        title: 'Rename diagram',
        label: 'Name',
        defaultValue: diagram.name,
      });
      if (!newName) {
        return;
      }
      dispatch({ type: DiagramActionTypes.RENAME_DIAGRAM, id, name: newName });
      void dataModelStorage.save({ ...diagram, name: newName });
    } catch {
      // TODO log
    }
  };
}

export function openDiagramFromFile(
  file: File
): DataModelingThunkAction<Promise<void>, OpenDiagramAction> {
  return async (dispatch, getState, { dataModelStorage, track }) => {
    try {
      const { name, edits } = await getDiagramContentsFromFile(file);

      const existingDiagramNames = (await dataModelStorage.loadAll()).map(
        (diagram) => diagram.name
      );

      const diagram: MongoDBDataModelDescription = {
        id: new UUID().toString(),
        name: getDiagramName(existingDiagramNames, name),
        connectionId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        edits,
      };
      dispatch(openDiagram(diagram));
      track('Data Modeling Diagram Imported', {});
      void dataModelStorage.save(diagram);
    } catch (error) {
      openToast('data-modeling-file-read-error', {
        variant: 'warning',
        title: 'Error opening diagram',
        description: (error as Error).message,
      });
    }
  };
}

export function updateRelationship(
  relationship: Relationship
): DataModelingThunkAction<boolean, ApplyEditAction | ApplyEditFailedAction> {
  return applyEdit({
    type: 'UpdateRelationship',
    relationship,
  });
}

export function deleteRelationship(
  relationshipId: string
): DataModelingThunkAction<void, RelationSelectedAction> {
  return (dispatch, getState, { track }) => {
    const currentNumberOfRelationships = getCurrentNumberOfRelationships(
      getState()
    );
    dispatch(
      applyEdit({
        type: 'RemoveRelationship',
        relationshipId,
      })
    );
    track('Data Modeling Relationship Deleted', {
      num_relationships: currentNumberOfRelationships - 1,
    });
  };
}

export function deleteCollection(
  ns: string
): DataModelingThunkAction<void, ApplyEditAction | ApplyEditFailedAction> {
  return (dispatch, getState, { track }) => {
    track('Data Modeling Collection Removed', {
      source: 'side_panel',
    });

    dispatch(applyEdit({ type: 'RemoveCollection', ns }));
  };
}

export function updateCollectionNote(
  ns: string,
  note: string
): DataModelingThunkAction<void, ApplyEditAction | ApplyEditFailedAction> {
  return applyEdit({ type: 'UpdateCollectionNote', ns, note });
}

export function removeField(
  ns: string,
  field: FieldPath
): DataModelingThunkAction<void, ApplyEditAction | ApplyEditFailedAction> {
  return (dispatch, getState, { track }) => {
    track('Data Modeling Field Removed', {
      source: 'side_panel',
    });

    dispatch(applyEdit({ type: 'RemoveField', ns, field }));
  };
}

export function renameField(
  ns: string,
  field: FieldPath,
  newName: string
): DataModelingThunkAction<void, ApplyEditAction | ApplyEditFailedAction> {
  return (dispatch, getState, { track }) => {
    track('Data Modeling Field Renamed', {
      source: 'side_panel',
    });

    dispatch(applyEdit({ type: 'RenameField', ns, field, newName }));
  };
}

/**
 * @internal Exported for testing purposes only.
 * If the field had a single type, we return that, otherwise 'mixed'.
 */
export function getTypeNameForTelemetry(
  bsonType: string | string[] | undefined
): string | undefined {
  if (!bsonType) {
    return;
  }
  if (Array.isArray(bsonType)) {
    if (bsonType.length === 0) {
      return undefined;
    }
    if (bsonType.length === 1) {
      return bsonType[0];
    }
    return 'mixed';
  }
  return bsonType;
}

export function changeFieldType(
  ns: string,
  fieldPath: FieldPath,
  newTypes: string[]
): DataModelingThunkAction<void, ApplyEditAction | ApplyEditFailedAction> {
  return (dispatch, getState, { track }) => {
    const collectionSchema = selectCurrentModelFromState(
      getState()
    ).collections.find((collection) => collection.ns === ns)?.jsonSchema;
    if (!collectionSchema) throw new Error('Collection not found in model');
    const field = getFieldFromSchema({
      jsonSchema: collectionSchema,
      fieldPath: fieldPath,
    });
    if (!field) throw new Error('Field not found in schema');
    const to = getSchemaWithNewTypes(field.jsonSchema, newTypes);

    track('Data Modeling Field Type Changed', {
      source: 'side_panel',
      from: getTypeNameForTelemetry(field.jsonSchema.bsonType),
      to: getTypeNameForTelemetry(to.bsonType),
    });

    dispatch(
      applyEdit({
        type: 'ChangeFieldType',
        ns,
        field: fieldPath,
        from: field.jsonSchema,
        to,
      })
    );
  };
}

function getPositionForNewCollection(
  existingCollections: DataModelCollection[],
  newCollection: Omit<DataModelCollection, 'displayPosition'>
): [number, number] {
  const existingNodes = existingCollections.map((collection) =>
    collectionToBaseNodeForLayout(collection)
  );
  const newNode = collectionToBaseNodeForLayout({
    ns: newCollection.ns,
    jsonSchema: newCollection.jsonSchema,
    displayPosition: [0, 0],
  });
  const xyposition = getCoordinatesForNewNode(existingNodes, newNode);
  return [xyposition.x, xyposition.y];
}

function getNameForNewCollection(
  existingCollections: DataModelCollection[]
): string {
  const database = toNS(existingCollections[0]?.ns).database; // TODO: again, what if there just isn't anything
  const baseName = `${database}.new-collection`;
  let counter = 1;
  let newName = baseName;

  while (existingCollections.some((collection) => collection.ns === newName)) {
    newName = `${baseName}-${counter}`;
    counter++;
  }

  return newName;
}

export function addCollection(
  ns?: string,
  position?: [number, number]
): DataModelingThunkAction<
  void,
  ApplyEditAction | ApplyEditFailedAction | CollectionSelectedAction
> {
  return (dispatch, getState, { track }) => {
    const existingCollections = selectCurrentModelFromState(
      getState()
    ).collections;
    if (!ns) ns = getNameForNewCollection(existingCollections);
    if (!position) {
      position = getPositionForNewCollection(existingCollections, {
        ns,
        jsonSchema: {} as MongoDBJSONSchema,
        indexes: [],
      });
    }

    track('Data Modeling Collection Added', {
      source: 'toolbar',
    });

    const edit: Omit<
      Extract<Edit, { type: 'AddCollection' }>,
      'id' | 'timestamp'
    > = {
      type: 'AddCollection',
      ns,
      initialSchema: {
        bsonType: 'object',
        properties: {
          _id: {
            bsonType: 'objectId',
          },
        },
        required: ['_id'],
      },
      position,
    };
    dispatch(applyEdit(edit));
  };
}

/**
 * @internal Exported for testing purposes only, use `selectCurrentModel` or
 * `selectCurrentModelFromState` instead
 */
export function getCurrentModel(
  edits: MongoDBDataModelDescription['edits']
): StaticModel {
  // Get the last 'SetModel' edit.
  const reversedSetModelEditIndex = edits
    .slice()
    .reverse()
    .findIndex((edit) => edit.type === 'SetModel');
  if (reversedSetModelEditIndex === -1) {
    throw new Error('No diagram model found.');
  }

  // Calculate the actual index in the original array.
  const lastSetModelEditIndex = edits.length - 1 - reversedSetModelEditIndex;

  // Start with the StaticModel from the last `SetModel` edit.
  const lastSetModelEdit = edits[lastSetModelEditIndex];
  if (lastSetModelEdit.type !== 'SetModel') {
    throw new Error('Something went wrong, last edit is not a SetModel');
  }
  let currentModel = lastSetModelEdit.model;

  // Apply all subsequent edits after the last `SetModel` edit.
  for (let i = lastSetModelEditIndex + 1; i < edits.length; i++) {
    const edit = edits[i];
    currentModel = _applyEdit(edit, currentModel);
  }

  return currentModel;
}

export function getCurrentDiagramFromState(
  state: DataModelingState
): MongoDBDataModelDescription {
  if (!state.diagram) {
    throw new Error('No current diagram in state');
  }
  const {
    id,
    connectionId,
    name,
    createdAt,
    updatedAt,
    edits: { current: edits },
  } = state.diagram;

  return { id, connectionId, name, edits, createdAt, updatedAt };
}

const selectCurrentDiagramFromState = memoize(getCurrentDiagramFromState);

/**
 * Memoised method to return computed model
 */
export const selectCurrentModel = memoize(getCurrentModel);

export const selectCurrentModelFromState = (state: DataModelingState) => {
  return selectCurrentModel(selectCurrentDiagramFromState(state).edits);
};

function extractFieldsFromSchema(parentSchema: MongoDBJSONSchema): FieldPath[] {
  const fields: FieldPath[] = [];
  traverseSchema({
    jsonSchema: parentSchema,
    visitor: ({ fieldPath }) => {
      fields.push(fieldPath);
    },
  });
  return fields;
}

function getFieldsForCurrentModel(
  edits: MongoDBDataModelDescription['edits']
): Record<string, string[][]> {
  const model = selectCurrentModel(edits);
  const fields = Object.fromEntries(
    model.collections.map((collection) => {
      return [collection.ns, extractFieldsFromSchema(collection.jsonSchema)];
    })
  );
  return fields;
}

export const selectFieldsForCurrentModel = memoize(getFieldsForCurrentModel);

export function getRelationshipForCurrentModel(
  edits: MongoDBDataModelDescription['edits'],
  relationshipId: string
) {
  return selectCurrentModel(edits).relationships.find(
    (r) => r.id === relationshipId
  );
}

function getCurrentNumberOfRelationships(state: DataModelingState): number {
  return selectCurrentModelFromState(state).relationships.length;
}
