import { SSHConnectionOptions } from "../hooks/use-connect-form";
import { checkForInvalidCharacterInHost } from "./check-for-invalid-character-in-host";
import { SSHFormErrors } from "./connect-form-errors";

export function validateSshOptions(
  key: keyof SSHConnectionOptions,
  value: string | number,
  isSRV: boolean,
  sshOptions?: SSHConnectionOptions,
): {isInvalid: boolean, errors: SSHFormErrors} {
  let isInvalid = false;
  const errors: SSHFormErrors = {};
  switch(key) {
    case 'host':
      try {
        checkForInvalidCharacterInHost(value as string, isSRV);
      } catch (e) {
        isInvalid = true;
        errors[key] = (e as Error).message;
      }
      break;
    case 'username': {
      if (!value && sshOptions?.password) {
        isInvalid = true;
        errors['username'] = 'Username is required along with password.';
      }
      break;
    }
    case 'password': {
      if (value && !sshOptions?.username) {
        isInvalid = true;
        errors['username'] = 'Username is required along with password.';
      }
      break;
    }
    case 'identityKeyPassphrase': {
      if (value && !sshOptions?.identityKeyFile) {
        isInvalid = true;
        errors['identityKeyFile'] = 'File is required along with passphrase.';
      }
      break;
    }
  }

  return {isInvalid, errors};
}
