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
  /**
   * Human-readable description of what the saved item does. Surfaced to
   * AI agents via the MCP `list-saved-queries` tool — items without a
   * description are hidden from that catalog.
   */
  description?: string;
  /**
   * Optional slash-command name under which the MCP server publishes the
   * saved item as an MCP prompt (e.g. `search-trips` becomes
   * `/search-trips` in Claude Desktop / Cursor). Validated in the UI;
   * uniqueness across items is enforced by the MCP server.
   */
  mcpPromptName?: string;
};

export type State = {
  id: string | undefined;
};

const INITIAL_STATE: State = {
  id: undefined,
};

export const ActionTypes = {
  EditItemClicked:
    'compass-saved-aggregations-queries/edit-item/editItemClicked',
  EditItemCancelled:
    'compass-saved-aggregations-queries/edit-item/editItemCancelled',
  EditItemUpdated:
    'compass-saved-aggregations-queries/edit-item/editItemUpdated',
} as const;

type EditItemClickedAction = {
  type: typeof ActionTypes.EditItemClicked;
  id: string;
};

type EditItemCancelledAction = {
  type: typeof ActionTypes.EditItemCancelled;
};

type EditItemUpdatedAction = {
  type: typeof ActionTypes.EditItemUpdated;
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

    // Treat `''` as "clear the field" and `undefined` as "leave alone".
    // The form always submits both fields, so empty string here means
    // the user deleted the value.
    const description = attributes.description?.trim();
    const mcpPromptName = attributes.mcpPromptName?.trim();

    switch (item.type) {
      case 'aggregation':
        await pipelineStorage?.updateAttributes(id, {
          name: attributes.name,
          description:
            description === undefined ? undefined : description || undefined,
          mcpPromptName:
            mcpPromptName === undefined
              ? undefined
              : mcpPromptName || undefined,
        });
        break;
      case 'query':
      case 'updatemany':
        await queryStorage?.updateAttributes(id, {
          _name: attributes.name,
          _dateModified: new Date(),
          _description:
            description === undefined ? undefined : description || undefined,
          _mcpPromptName:
            mcpPromptName === undefined
              ? undefined
              : mcpPromptName || undefined,
        });
        break;
    }

    dispatch({
      type: ActionTypes.EditItemUpdated,
      id,
    });

    await dispatch(fetchItems());
  };

export default reducer;
