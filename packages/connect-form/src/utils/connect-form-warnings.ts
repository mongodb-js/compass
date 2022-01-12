export interface ConnectionFormWarning {
  message: string;
}

export type FormValidationWarning = {
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
