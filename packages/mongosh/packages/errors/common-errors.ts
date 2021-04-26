
/**
 * @mongoshErrors
 */
enum CommonErrors {
  /**
   * Signals calling an API method with an invalid argument.
   *
   * **Solution: See the error output for details on allowed argument values.**
   */
  InvalidArgument = 'COMMON-10001',

  /**
   * Signals calling an API method that is not allowed in the current state.
   *
   * **Solution: See the error output for details.**
   */
  InvalidOperation = 'COMMON-10002',

  /**
   * Signals calling an API method that has been deprecated or using an argument or option of an API method that has been deprecated
   * and therefore is no longer supported.
   *
   * **Solution: See the error output for details on alternatives or consult the official documentation.**
   */
  Deprecated = 'COMMON-10003',

  /**
   * Signals an error while running a specific command against the database.
   *
   * **Solution: Check the error output for more details and ensure the database is healthy and available.**
   */
  CommandFailed = 'COMMON-10004',

  /**
   * Signals an unexpected internal error of mongosh.
   *
   * **Please file a bug report for the `MONGOSH` project here: https://jira.mongodb.org.**
   */
  UnexpectedInternalError = 'COMMON-90001',

  /**
   * Signals usage of a method that is not implemented yet.
   *
   * **See the error output for details.**
   */
  NotImplemented = 'COMMON-90002'
}

export {
  CommonErrors
};
