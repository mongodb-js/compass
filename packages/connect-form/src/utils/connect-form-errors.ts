import { ConnectionOptions } from 'mongodb-data-service';

import { MARKABLE_FORM_FIELD_NAMES } from '../constants/markable-form-fields';
import { SSHConnectionOptions } from './connection-options-handler';

interface GenericConnectionError {
  fieldName: undefined;
  message: string;
}

interface HostFieldError {
  fieldName: MARKABLE_FORM_FIELD_NAMES.HOSTS;
  hostIndex: number;
  message: string;
}

export interface SchemaFieldError {
  fieldName: MARKABLE_FORM_FIELD_NAMES.IS_SRV;
  message: string;
}

export interface SSHTunnelFieldError {
  fieldName: MARKABLE_FORM_FIELD_NAMES.IS_SSH;
  errors: SSHFormErrors;
  message?: string;
}

export type SSHFormErrors = {
  [key in keyof SSHConnectionOptions]?: string;
};

export type ConnectionFormError =
  | GenericConnectionError
  | HostFieldError
  | SchemaFieldError
  | SSHTunnelFieldError
  | FormValidationError;

export type FormValidationError = {
  message: string;
  fieldName?: FormFieldName;
};

export type FormFieldName =
  | 'username'
  | 'password'
  | 'hostname'
  | 'kerberosPrincipal'
  | 'ldapUsername'
  | 'ldapPassword'
  | 'schema'
  | 'sshHostname'
  | 'sshUsername'
  | 'sshPassword';
