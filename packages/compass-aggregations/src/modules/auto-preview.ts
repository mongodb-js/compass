import type { AnyAction } from "redux";
import type { ThunkAction } from "redux-thunk";
import type { RootState } from ".";
import { runStage } from "./pipeline";

export enum ActionTypes {
  AutoPreviewToggled = 'compass-aggregations/autoPreviewToggled',
}

type AutoPreviewToggledAction = {
  type: ActionTypes.AutoPreviewToggled;
};

export const INITIAL_STATE = true;

export default function reducer(state = INITIAL_STATE, action: AnyAction): boolean {
  if (action.type === ActionTypes.AutoPreviewToggled) {
    return !state;
  }
  return state;
}

export const toggleAutoPreview = (): ThunkAction<
  void,
  RootState,
  void,
  AutoPreviewToggledAction
> => {
  return (dispatch, getState) => {
    const {
      autoPreview,
    } = getState();
    if (!autoPreview && global?.process?.env?.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR === 'true') {
      dispatch(runStage(0))
    }
    dispatch({
      type: ActionTypes.AutoPreviewToggled
    });
  };
};
