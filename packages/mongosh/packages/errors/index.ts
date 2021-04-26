import { CommonErrors } from './common-errors';

function getScopeFromErrorCode(code: string | null | undefined): string | undefined {
  if (!code) {
    return undefined;
  }
  const match = code.match(/^([a-zA-Z0-9]+)-/);
  return !match ? undefined : match[1];
}

abstract class MongoshBaseError extends Error {
  readonly code: string | undefined;
  readonly scope: string | undefined;
  readonly metadata: Object | undefined;

  constructor(name: string, message: string, code?: string, metadata?: Object) {
    super(code ? `[${code}] ${message}` : message);
    this.name = name;
    this.code = code;
    this.scope = getScopeFromErrorCode(code);
    this.metadata = metadata;
  }
}

class MongoshRuntimeError extends MongoshBaseError {
  constructor(message: string, code?: string, metadata?: Object) {
    super('MongoshRuntimeError', message, code, metadata);
  }
}

class MongoshInternalError extends MongoshBaseError {
  constructor(message: string, metadata?: Object) {
    super(
      'MongoshInternalError',
      `${message}
This is an error inside Mongosh. Please file a bug report for the MONGOSH project here: https://jira.mongodb.org.`,
      CommonErrors.UnexpectedInternalError,
      metadata
    );
  }
}

class MongoshUnimplementedError extends MongoshBaseError {
  constructor(message: string, code?: string, metadata?: Object) {
    super('MongoshUnimplementedError', message, code, metadata);
  }
}

class MongoshInvalidInputError extends MongoshBaseError {
  constructor(message: string, code?: string, metadata?: Object) {
    super('MongoshInvalidInputError', message, code, metadata);
  }
}

class MongoshWarning extends MongoshBaseError {
  constructor(message: string, code?: string, metadata?: Object) {
    super('MongoshWarning', message, code, metadata);
  }
}

class MongoshDeprecatedError extends MongoshBaseError {
  constructor(message: string, metadata?: Object) {
    super(
      'MongoshDeprecatedError',
      message,
      CommonErrors.Deprecated,
      metadata
    );
  }
}

class MongoshCommandFailed extends MongoshBaseError {
  constructor(message: string, metadata?: Object) {
    super(
      'MongoshCommandFailed',
      `Command ${message} returned ok: 0. To see the raw results of the command, use 'runCommand' instead.`,
      CommonErrors.CommandFailed,
      metadata
    );
  }
}

export {
  getScopeFromErrorCode,
  MongoshBaseError,
  MongoshWarning,
  MongoshRuntimeError,
  MongoshInternalError,
  MongoshInvalidInputError,
  MongoshUnimplementedError,
  MongoshDeprecatedError,
  MongoshCommandFailed,
  CommonErrors
};
