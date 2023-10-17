import type { AnyAction } from 'redux';
import { isAction } from './../utils/is-action';

export enum ActionTypes {
  SetFields = 'indexes/SetFields',
}

export type Field = {
  name: string;
  description: string;
};

type SetFieldsAction = {
  type: ActionTypes.SetFields;
  fields: Field[];
};

type State = Field[];

export const INITIAL_STATE: State = [];

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (isAction<SetFieldsAction>(action, ActionTypes.SetFields)) {
    return action.fields;
  }
  return state;
}

export const setFields = (fields: Field[]): SetFieldsAction => ({
  type: ActionTypes.SetFields,
  fields,
});
