import type { Field } from '../modules/create-index';

export const areAllFieldsFilledIn = (fields: Field[]) => {
  return fields.every((field) => field.name && field.type);
};
