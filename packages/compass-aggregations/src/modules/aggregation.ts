import type { Reducer } from 'redux';
import type { AggregateOptions, Document } from 'mongodb';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { generateStage } from './stage';

export enum ActionTypes {
  RunAggregation = 'compass-aggregations/runAggregation',
}

type RunAggregationAction = {
  type: ActionTypes.RunAggregation;
  documents: Document[];
};

export type Actions =
  | RunAggregationAction;

export type State = {
  documents: Document[];
};

export const INITIAL_STATE: State = {
  documents: [],
};

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.RunAggregation:
      return { documents: action.documents };
    default:
      return state;
  }
};

export const runAggregation = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return async (dispatch, getState) => {
    const {
      pipeline,
      namespace,
      maxTimeMS,
      collation,
      dataService: { dataService }
    } = getState();

    const stages = pipeline.map(generateStage);
    const options: AggregateOptions = {
      maxTimeMS: maxTimeMS || DEFAULT_MAX_TIME_MS,
      allowDiskUse: true,
      collation: collation || undefined,
    };
    if (dataService) {
      const cursor = dataService.aggregate(
        namespace,
        stages,
        options
      );
      const documents = await cursor.toArray();
      return dispatch({ type: ActionTypes.RunAggregation, documents });
    }
  };
};

export default reducer;
