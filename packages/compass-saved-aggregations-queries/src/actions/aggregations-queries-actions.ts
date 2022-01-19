import { AnyAction } from "redux";

export enum actions {
  FETCH_DATA = 'FETCH_DATA',
}

export const fetchItems = (): AnyAction => ({
  type: actions.FETCH_DATA
});
