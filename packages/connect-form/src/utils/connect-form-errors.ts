import { ConnectionOptions } from 'mongodb-data-service';

import {
  MARKABLE_FORM_FIELD_NAMES
} from '../constants/markable-form-fields';

// When a field in the connection form is updated to a value that cannot be
// represented in `ConnectionOptions`, like a host name with `@`, it stores the
// editing field using this interface so it can be changed until it is valid.
export type InvalidFormFieldsState = {
  hosts: string[] | null;
};

export interface ConnectionFormError {
  fieldName?: MARKABLE_FORM_FIELD_NAMES;
  message: string;
}

export function getConnectFormErrors(
  connectionOptions: ConnectionOptions
): ConnectionFormError[] {
  return [];
}
