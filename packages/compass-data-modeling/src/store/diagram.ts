import type { Reducer } from 'redux';
import { UUID } from 'bson';
import { isAction } from './util';
import type { EditAction, Relationship } from '../services/data-model-storage';
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

function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return Array.isArray(arr) && arr.length > 0;
}

export type SelectedItems = { type: 'collection' | 'relationship'; id: string };

export type DiagramState =
  | (Omit<MongoDBDataModelDescription, 'edits'> & {
      edits: {
        prev: Edit[][];
        current: [Edit, ...Edit[]];
        next: Edit[][];
      };
      editErrors?: string[];
      selectedItems: SelectedItems | null;
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
  DIAGRAM_BACKGROUND_SELECTED = 'data-modeling/diagram/DIAGRAM_BACKGROUND_SELECTED',
  DRAWER_CLOSED = 'data-modeling/diagram/DRAWER_CLOSED',
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

export type DiagramBackgroundSelectedAction = {
  type: DiagramActionTypes.DIAGRAM_BACKGROUND_SELECTED;
};

export type DrawerClosedAction = {
  type: DiagramActionTypes.DRAWER_CLOSED;
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
  | DiagramBackgroundSelectedAction
  | DrawerClosedAction;

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
  if (isAction(action, DiagramActionTypes.APPLY_EDIT)) {
    const newState = {
      ...state,
      edits: {
        prev: [...state.edits.prev, state.edits.current],
        current: [...state.edits.current, action.edit] as [Edit, ...Edit[]],
        next: [],
      },
      editErrors: undefined,
      updatedAt: new Date().toISOString(),
    };

    if (
      action.edit.type === 'RemoveRelationship' &&
      state.selectedItems?.type === 'relationship' &&
      state.selectedItems.id === action.edit.relationshipId
    ) {
      newState.selectedItems = null;
    }

    return newState;
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
  if (
    isAction(action, DiagramActionTypes.DIAGRAM_BACKGROUND_SELECTED) ||
    isAction(action, DiagramActionTypes.DRAWER_CLOSED)
  ) {
    return {
      ...state,
      selectedItems: null,
    };
  }
  return state;
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

export function selectBackground(): DiagramBackgroundSelectedAction {
  return {
    type: DiagramActionTypes.DIAGRAM_BACKGROUND_SELECTED,
  };
}

export function createNewRelationship(
  namespace: string
): DataModelingThunkAction<void, RelationSelectedAction> {
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
            { ns: namespace, cardinality: 1, fields: null },
            { ns: null, cardinality: 1, fields: null },
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

export function closeDrawer(): DrawerClosedAction {
  return { type: DiagramActionTypes.DRAWER_CLOSED };
}

function _applyEdit(edit: Edit, model?: StaticModel): StaticModel {
  if (edit.type === 'SetModel') {
    return edit.model;
  }
  if (!model) {
    throw new Error('Editing a model that has not been initialized');
  }
  switch (edit.type) {
    case 'AddRelationship': {
      return {
        ...model,
        relationships: [...model.relationships, edit.relationship],
      };
    }
    case 'RemoveRelationship': {
      return {
        ...model,
        relationships: model.relationships.filter(
          (relationship) => relationship.id !== edit.relationshipId
        ),
      };
    }
    case 'UpdateRelationship': {
      const existingRelationship = model.relationships.find((r) => {
        return r.id === edit.relationship.id;
      });
      if (!existingRelationship) {
        throw new Error('Can not update non-existent relationship');
      }
      return {
        ...model,
        relationships: model.relationships.map((r) => {
          return r === existingRelationship ? edit.relationship : r;
        }),
      };
    }
    case 'MoveCollection': {
      return {
        ...model,
        collections: model.collections.map((collection) => {
          if (collection.ns === edit.ns) {
            return {
              ...collection,
              displayPosition: edit.newPosition,
            };
          }
          return collection;
        }),
      };
    }
    default: {
      return model;
    }
  }
}

/**
 * @internal Exported for testing purposes only, use `selectCurrentModel`
 * instead
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

/**
 * Memoised method to return computed model
 */
export const selectCurrentModel = memoize(getCurrentModel);

function extractFields(
  parentSchema: MongoDBJSONSchema,
  parentKey?: string[],
  fields: string[][] = []
) {
  if ('properties' in parentSchema && parentSchema.properties) {
    for (const [key, value] of Object.entries(parentSchema.properties)) {
      const fullKey = parentKey ? [...parentKey, key] : [key];
      fields.push(fullKey);
      extractFields(value, fullKey, fields);
    }
  }
  return fields;
}

function getFieldsForCurrentModel(
  edits: MongoDBDataModelDescription['edits']
): Record<string, string[][]> {
  const model = selectCurrentModel(edits);
  const fields = Object.fromEntries(
    model.collections.map((collection) => {
      return [collection.ns, extractFields(collection.jsonSchema)];
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
  return selectCurrentModel(getCurrentDiagramFromState(state).edits)
    .relationships.length;
}
