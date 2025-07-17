import type { Reducer } from 'redux';
import { isAction } from './util';
import { DiagramActionTypes, updateRelationship } from './diagram';
import type {
  Relationship,
  RelationshipSide,
} from '../services/data-model-storage';
import { UUID } from 'bson';
import type { DataModelingThunkAction } from './reducer';

type RelationshipEditingState = {
  relationshipId: string;
  localCollection: string;
  localField: string;
  foreignCollection: string;
  foreignField: string;
  cardinality: string;
  modified: boolean;
};

/**
 * The source of truth for the current side panel state is driven by currently
 * selected items on the diagram stored in the `diagram` slice, when
 * transitioning to special states inside the drawer for a currently selected
 * items, we can add new view types to the side-panel state that would extend
 * it. In theory this is a view-only state, on practice we need to make sure
 * it's preserved when user navigates around the app (and so components can
 * unmount themselves) and so that's why it has its own slice.
 */
export type SidePanelState =
  | {
      viewType: 'relationship-editing';
      relationshipFormState: RelationshipEditingState;
    }
  | { viewType: null; relationshipFormState?: never };

export enum SidePanelActionTypes {
  CREATE_NEW_RELATIONSHIP_CLICKED = 'data-modeling/side-panel/CREATE_NEW_RELATIONSHIP_CLICKED',
  EDIT_RELATIONSHIP_CLICKED = 'data-modeling/side-panel/EDIT_RELATIONSHIP_CLICKED',
  EDIT_RELATIONSHIP_FORM_FIELD_CHANGED = 'data-modeling/side-panel/EDIT_RELATIONSHIP_FORM_FIELD_CHANGED',
  EDIT_RELATIONSHIP_FORM_SUBMITTED = 'data-modeling/side-panel/EDIT_RELATIONSHIP_FORM_SUBMITTED',
  EDIT_RELATIONSHIP_FORM_CANCELED = 'data-modeling/side-panel/EDIT_RELATIONSHIP_FORM_CANCELED',
  SIDE_PANEL_CLOSE_CLICKED = 'data-modeling/side-panel/SIDE_PANEL_CLOSE_CLICKED',
}

export type CreateNewRelationshipClickedAction = {
  type: SidePanelActionTypes.CREATE_NEW_RELATIONSHIP_CLICKED;
  namespace: string;
};

export function createNewRelationship(
  namespace: string
): CreateNewRelationshipClickedAction {
  return {
    type: SidePanelActionTypes.CREATE_NEW_RELATIONSHIP_CLICKED,
    namespace,
  };
}

export type EditRelationshipClickedAction = {
  type: SidePanelActionTypes.EDIT_RELATIONSHIP_CLICKED;
  relationship: Relationship;
};

export function startRelationshipEdit(
  relationship: Relationship
): EditRelationshipClickedAction {
  return {
    type: SidePanelActionTypes.EDIT_RELATIONSHIP_CLICKED,
    relationship,
  };
}

export type RelationshipFormFields = Exclude<
  keyof RelationshipEditingState,
  'relationshipId' | 'modified'
>;

export type EditRelationshipFormFieldChangedAction = {
  type: SidePanelActionTypes.EDIT_RELATIONSHIP_FORM_FIELD_CHANGED;
  field: RelationshipFormFields;
  value: string;
};

export function changeRelationshipFormField(
  field: RelationshipFormFields,
  value: string
): EditRelationshipFormFieldChangedAction {
  return {
    type: SidePanelActionTypes.EDIT_RELATIONSHIP_FORM_FIELD_CHANGED,
    field,
    value,
  };
}

export type EditRelationshipFormSubmittedAction = {
  type: SidePanelActionTypes.EDIT_RELATIONSHIP_FORM_SUBMITTED;
  relationshipId: string;
};

export function submitRelationshipEdit(): DataModelingThunkAction<
  void,
  EditRelationshipFormSubmittedAction
> {
  return (dispatch, getState) => {
    const { viewType, relationshipFormState } = getState().sidePanel;

    if (viewType !== 'relationship-editing') {
      return;
    }

    const {
      relationshipId,
      localCollection,
      localField,
      foreignCollection,
      foreignField,
      cardinality,
    } = relationshipFormState;

    dispatch(
      updateRelationship(relationshipId, {
        localCollection,
        localField,
        foreignCollection,
        foreignField,
        cardinality,
      })
    );
    dispatch({
      type: SidePanelActionTypes.EDIT_RELATIONSHIP_FORM_SUBMITTED,
      relationshipId,
    });
  };
}

export type EditRelationshipFormCanceledAction = {
  type: SidePanelActionTypes.EDIT_RELATIONSHIP_FORM_CANCELED;
};

export function cancelRelationshipEditing(): EditRelationshipFormCanceledAction {
  return { type: SidePanelActionTypes.EDIT_RELATIONSHIP_FORM_CANCELED };
}

export type SidePanelCloseClickedAction = {
  type: SidePanelActionTypes.SIDE_PANEL_CLOSE_CLICKED;
};

export function closeSidePanel(): SidePanelCloseClickedAction {
  return { type: SidePanelActionTypes.SIDE_PANEL_CLOSE_CLICKED };
}

export type SidePanelActions =
  | CreateNewRelationshipClickedAction
  | EditRelationshipClickedAction
  | EditRelationshipFormFieldChangedAction
  | EditRelationshipFormSubmittedAction
  | EditRelationshipFormCanceledAction
  | SidePanelCloseClickedAction;

const INITIAL_STATE: SidePanelState = {
  viewType: null,
};

function relationshipsCardinalityToFormCardinality(
  localRelationship: RelationshipSide,
  foreignRelationship: RelationshipSide
) {
  return [
    localRelationship.cardinality === 1 ? 'one' : 'many',
    foreignRelationship.cardinality === 1 ? 'one' : 'many',
  ].join('-to-');
}

export const sidePanelReducer: Reducer<SidePanelState> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction(action, SidePanelActionTypes.CREATE_NEW_RELATIONSHIP_CLICKED)) {
    return {
      viewType: 'relationship-editing',
      relationshipFormState: {
        relationshipId: new UUID().toHexString(),
        localCollection: action.namespace,
        localField: '',
        foreignCollection: '',
        foreignField: '',
        cardinality: '',
        modified: false,
      },
    };
  }
  if (
    isAction(action, SidePanelActionTypes.EDIT_RELATIONSHIP_CLICKED) ||
    // We don't have a non-editable state for relationship view, so immediately
    // switch to editing mode when relationship is selected
    isAction(action, DiagramActionTypes.RELATIONSHIP_SELECTED)
  ) {
    const {
      id,
      relationship: [local, foreign],
    } = action.relationship;
    return {
      viewType: 'relationship-editing',
      relationshipFormState: {
        relationshipId: id,
        localCollection: local.ns,
        localField: local.fields[0] ?? '', // TODO: not sure what's expected here? a multiselect?
        foreignCollection: foreign.ns,
        foreignField: foreign.fields[0] ?? '',
        cardinality: relationshipsCardinalityToFormCardinality(local, foreign),
        modified: false,
      },
    };
  }
  if (
    isAction(action, SidePanelActionTypes.EDIT_RELATIONSHIP_FORM_FIELD_CHANGED)
  ) {
    if (state.viewType !== 'relationship-editing') {
      return state;
    }
    if (state.relationshipFormState[action.field] === action.value) {
      return state;
    }
    const newState = {
      ...state,
      relationshipFormState: {
        ...state.relationshipFormState,
        [action.field]: action.value,
        modified: true,
      },
    };
    // We only allow to select from the list that is based on collection value,
    // when `collection` is changed, reset the `field` field
    if (action.field === 'localCollection') {
      newState.relationshipFormState.localField = '';
    }
    if (action.field === 'foreignCollection') {
      newState.relationshipFormState.foreignField = '';
    }
    return newState;
  }
  if (isAction(action, DiagramActionTypes.APPLY_EDIT)) {
    if (
      action.edit.type === 'RemoveRelationship' &&
      action.edit.relationshipId === state.relationshipFormState?.relationshipId
    ) {
      return { viewType: null };
    }
    return state;
  }
  if (
    isAction(action, SidePanelActionTypes.EDIT_RELATIONSHIP_FORM_CANCELED) ||
    isAction(action, SidePanelActionTypes.EDIT_RELATIONSHIP_FORM_SUBMITTED) ||
    isAction(action, DiagramActionTypes.COLLECTION_SELECTED)
  ) {
    return { viewType: null };
  }
  return state;
};
