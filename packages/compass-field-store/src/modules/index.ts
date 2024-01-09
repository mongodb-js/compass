import type { Reducer } from 'redux';
import { uniq } from 'lodash';
import type { SchemaField } from 'mongodb-schema';
import type { SchemaFieldSubset } from './fields';
import { mergeSchema } from './fields';

export const CHANGE_FIELDS = 'field-store/CHANGE_FIELDS';

export type FieldsState = Record<
  string,
  { fields: Record<string, SchemaFieldSubset>; topLevelFields: string[] }
>;

const reducer: Reducer<FieldsState> = (state = {}, action) => {
  if (action.type === CHANGE_FIELDS) {
    const currentNamespaceFields = state[action.namespace] ?? {};
    const { fields, topLevelFields } = mergeSchema(
      currentNamespaceFields.fields ?? {},
      action.schemaFields
    );

    return {
      ...state,
      [action.namespace]: {
        fields,
        topLevelFields: uniq(
          (currentNamespaceFields.topLevelFields ?? []).concat(topLevelFields)
        ),
      },
    };
  }
  return state;
};

export const changeFields = (
  namespace: string,
  schemaFields: SchemaField[]
) => ({
  type: CHANGE_FIELDS,
  namespace,
  schemaFields,
});

export default reducer;
