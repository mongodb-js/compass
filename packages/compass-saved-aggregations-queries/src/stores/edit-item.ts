import type { Action, Reducer } from 'redux';
import type { SavedQueryAggregationThunkAction } from '.';
import { fetchItems } from './aggregations-queries-items';

function isAction<A extends Action>(
  action: Action,
  type: A['type']
): action is A {
  return action.type === type;
}

export type UpdateItemAttributes = {
  name: string;
};

export type State = {
  id: string | undefined;
};

const INITIAL_STATE: State = {
  id: undefined,
};

export enum ActionTypes {
  EditItemClicked = 'compass-saved-aggregations-queries/edit-item/editItemClicked',
  EditItemCancelled = 'compass-saved-aggregations-queries/edit-item/editItemCancelled',
  EditItemUpdated = 'compass-saved-aggregations-queries/edit-item/editItemUpdated',
}

type EditItemClickedAction = {
  type: ActionTypes.EditItemClicked;
  id: string;
};

type EditItemCancelledAction = {
  type: ActionTypes.EditItemCancelled;
};

type EditItemUpdatedAction = {
  type: ActionTypes.EditItemUpdated;
  id: string;
};

export type Actions =
  | EditItemClickedAction
  | EditItemCancelledAction
  | EditItemUpdatedAction;

const reducer: Reducer<State, Action> = (state = INITIAL_STATE, action) => {
  if (isAction<EditItemClickedAction>(action, ActionTypes.EditItemClicked)) {
    return {
      id: action.id,
    };
  }
  if (
    isAction<EditItemCancelledAction>(action, ActionTypes.EditItemCancelled) ||
    isAction<EditItemUpdatedAction>(action, ActionTypes.EditItemUpdated)
  ) {
    return {
      id: undefined,
    };
  }
  return state;
};

export const editItem = (id: string): EditItemClickedAction => ({
  type: ActionTypes.EditItemClicked,
  id,
});

export const cancelEditItem = (): EditItemCancelledAction => ({
  type: ActionTypes.EditItemCancelled,
});

export const updateItem =
  (
    id: string,
    attributes: UpdateItemAttributes
  ): SavedQueryAggregationThunkAction<void, Actions> =>
  async (dispatch, getState, { queryStorage, pipelineStorage }) => {
    const {
      savedItems: { items },
    } = getState();

    const item = items.find((x) => x.id === id);
    if (!item) {
      return;
    }

    if (item.type === 'query') {
      await queryStorage?.updateAttributes(id, {
        _name: attributes.name,
        _dateModified: new Date(),
      });
    } else {
      await pipelineStorage?.updateAttributes(id, attributes);
    }

    dispatch({
      type: ActionTypes.EditItemUpdated,
      id,
    });

    await dispatch(fetchItems());
  };

export default reducer;
