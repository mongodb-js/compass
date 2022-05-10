import type { AnyAction } from "redux";
import type { ThunkAction } from "redux-thunk";
import type { RootState } from ".";
import { runStage } from "./pipeline";

export enum ActionTypes {
  AutoPreviewToggled = 'compass-aggregations/autoPreviewToggled',
}

export type AutoPreviewToggledAction = {
  type: ActionTypes.AutoPreviewToggled;
  value: boolean;
};

export const INITIAL_STATE = true;

export default function reducer(state = INITIAL_STATE, action: AnyAction): boolean {
  if (action.type === ActionTypes.AutoPreviewToggled) {
    return action.value;
  }
  return state;
}

export const toggleAutoPreview = (
  newVal: boolean
): ThunkAction<void, RootState, void, AutoPreviewToggledAction> => {
  return (dispatch) => {
    if (
      newVal &&
      global?.process?.env?.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR === 'true'
    ) {
      dispatch(runStage(0));
    }
    dispatch({
      type: ActionTypes.AutoPreviewToggled,
      value: newVal
    });
  };
};
