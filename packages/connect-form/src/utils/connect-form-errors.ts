import { ConnectionOptions } from 'mongodb-data-service';

import { MARKABLE_FORM_FIELD_NAMES } from '../constants/markable-form-fields';

export interface ConnectionFormError {
  fieldName?: MARKABLE_FORM_FIELD_NAMES;
  message: string;
}

export function getConnectFormErrors(
  connectionOptions: ConnectionOptions
): ConnectionFormError[] {
  return [];
}
