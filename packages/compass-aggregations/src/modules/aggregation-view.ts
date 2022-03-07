import type { Reducer } from 'redux';

type AggregationView = 'builder-view' | 'results-view';

enum ActionTypes {
  ChangeAggregationView = 'compass-aggregations/changeAggregationView',
}

type ChangeAggregationViewAction = {
  type: ActionTypes.ChangeAggregationView;
  view: AggregationView;
};

export type Actions = ChangeAggregationViewAction;
export type State = AggregationView;

export const INITIAL_STATE: State = 'builder-view';

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.ChangeAggregationView:
      return action.view;
    default:
      return state;
  }
};

export const changeAggregationView = (view: AggregationView): ChangeAggregationViewAction => ({
  type: ActionTypes.ChangeAggregationView,
  view,
});

export default reducer;
