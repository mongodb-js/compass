import { ConnectionOptions } from 'mongodb-data-service';
import { MARKABLE_FORM_FIELD_NAMES } from '../constants/markable-form-fields';
import { SSHFormErrors } from './connect-form-errors';
import { ConnectFormState } from '../hooks/use-connect-form';
import { checkForInvalidCharacterInHost } from './check-for-invalid-character-in-host';

export type SSHConnectionOptions = NonNullable<ConnectionOptions['sshTunnel']>;

export type SSHType = 'none' | 'password' | 'identity' | 'socks';

export interface UpdateConnectionOptions {
  type: 'update-connection-options';
  currentTab: SSHType;
  key: keyof SSHConnectionOptions;
  value: string | number;
}

export function handleUpdateConnectionOptions(
  action: UpdateConnectionOptions,
  {
    errors: initialErrors,
    connectionStringUrl,
    connectionOptions,
    connectionStringInvalidError,
    warnings,
  }: ConnectFormState
): ConnectFormState {
  const { key, value, currentTab } = action;

  if (currentTab === 'none') {
    return {
      connectionStringUrl,
      connectionOptions: {
        connectionString: connectionStringUrl.toString(),
        sshTunnel: undefined,
      },
      errors: initialErrors,
      warnings,
      connectionStringInvalidError,
    };
  }

  const errors = validateSshOptions(
    currentTab,
    key,
    value,
    connectionStringUrl.isSRV,
    connectionOptions.sshTunnel
  );

  if (!connectionOptions.sshTunnel) {
    connectionOptions.sshTunnel = {} as SSHConnectionOptions;
  }

  connectionOptions.sshTunnel[key] = value;

  const response: ConnectFormState = {
    connectionStringUrl,
    connectionOptions: {
      ...connectionOptions,
      connectionString: connectionStringUrl.toString(),
    },
    errors: [
      ...initialErrors.filter(
        ({ fieldName }) => fieldName !== MARKABLE_FORM_FIELD_NAMES.IS_SSH
      ),
      {
        fieldName: MARKABLE_FORM_FIELD_NAMES.IS_SSH,
        errors,
      },
    ],
    warnings,
    connectionStringInvalidError,
  };

  return response;
}

const validateSshOptions = (
  currentTab: Exclude<SSHType, 'none'>,
  key: keyof SSHConnectionOptions,
  value: string | number,
  isSRV: boolean,
  sshOptions?: SSHConnectionOptions
): SSHFormErrors => {
  const errors: SSHFormErrors =
    currentTab === 'identity'
      ? validateIdentityForm(key, value, isSRV, sshOptions)
      : validatePasswordOrSocksForm(key, value, isSRV, sshOptions);

  // filter falsy values
  for (const key in errors) {
    if (!errors[key]) {
      delete errors[key];
    }
  }

  return errors;
};

const validatePasswordOrSocksForm = (
  key: keyof SSHConnectionOptions,
  value: string | number,
  isSRV: boolean,
  sshOptions?: SSHConnectionOptions
) => {
  const errors: SSHFormErrors = {};
  switch (key) {
    case 'host':
      errors['host'] = getHostValidationError(value as string, isSRV);
      break;
    case 'port':
      errors['port'] = getPortValidationError(value as number);
      break;
    case 'username': {
      if (!value && sshOptions?.password) {
        errors['username'] = 'Username is required along with password.';
      }
      break;
    }
    case 'password': {
      if (value && !sshOptions?.username) {
        errors['username'] = 'Username is required along with password.';
      }
      break;
    }
  }
  return errors;
};

const validateIdentityForm = (
  key: keyof SSHConnectionOptions,
  value: string | number,
  isSRV: boolean,
  sshOptions?: SSHConnectionOptions
) => {
  const errors: SSHFormErrors = {};
  switch (key) {
    case 'host':
      errors['host'] = getHostValidationError(value as string, isSRV);
      break;
    case 'port':
      errors['port'] = getPortValidationError(value as number);
      break;
    case 'username':
      if (!value && sshOptions?.identityKeyFile) {
        errors['username'] = 'Username is required along with identity file.';
      }
      break;
    case 'identityKeyPassphrase':
      if (value && !sshOptions?.identityKeyFile) {
        errors['identityKeyFile'] = 'File is required along with passphrase.';
        errors['username'] = 'Username is required along with passphrase.';
      }
      break;
    case 'identityKeyFile':
      if (value && !sshOptions?.username) {
        errors['username'] = 'Username is required along with identity file.';
      }
      break;
  }

  return errors;
};

const getHostValidationError = (
  value: string,
  isSRV: boolean
): string | undefined => {
  if (!value) {
    return 'Host is required.';
  }
  try {
    checkForInvalidCharacterInHost(value, isSRV);
  } catch (e) {
    return (e as Error).message;
  }
};

const getPortValidationError = (value: number): string | undefined => {
  if (value < 1) {
    return 'Port must be a valid port number.';
  }
};
