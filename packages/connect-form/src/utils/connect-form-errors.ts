import { ConnectionOptions } from 'mongodb-data-service';

import { MARKABLE_FORM_FIELD_NAMES } from '../constants/markable-form-fields';

interface GenericConnectionError {
  fieldName: undefined;
  message: string;
}

interface HostFieldError {
  fieldName: MARKABLE_FORM_FIELD_NAMES.HOSTS;
  hostIndex: number;
  message: string;
}

interface SchemaFieldError {
  fieldName: MARKABLE_FORM_FIELD_NAMES.IS_SRV;
  message: string;
}

interface SSHTunnelFieldErrors {
  fieldName: 'SSH_TUNNEL';
  errors: {
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    identityKeyFile?: string;
    identityKeyPassphrase?: string;
  };
}

export type ConnectionFormError =
  | GenericConnectionError
  | HostFieldError
  | SchemaFieldError
  | SSHTunnelFieldErrors;

export function getConnectFormErrors(
  connectionOptions: ConnectionOptions
): ConnectionFormError[] {
  return [];
}
