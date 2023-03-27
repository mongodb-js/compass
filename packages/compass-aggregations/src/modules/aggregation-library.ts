import type { AnyAction, Reducer } from 'redux';

export type State = {
  isOpen: boolean;
};

export const INITIAL_STATE: State = {
  isOpen: false,
};

enum ActionTypes {
  AggregationLibraryToggled = 'compass-aggeregations/toggleAggregationLibrary',
}

const reducer: Reducer<State, AnyAction> = (state = INITIAL_STATE, action) => {
  if (action.type === ActionTypes.AggregationLibraryToggled) {
    return {
      ...state,
      isOpen: !state.isOpen,
    };
  } else {
    return state;
  }
};

export const toggleAggregationPanelVisibility = () => ({
  type: ActionTypes.AggregationLibraryToggled,
});
export default reducer;
