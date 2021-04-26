# `@mongosh/errors`

Package for [MongoDB Shell](mongosh)

## Usage

```
const { MongoshUnimplementedError } = require('@mongosh/errors');

function evaluate(input) {
  if (input === 'some input') {
    throw new MongoshUnimplementedError(`${input} is not implemented`);
  }
}

// throws: MongoshUnimplemetedError: some input is not implemented
evaluate('some input')
```

### Error Codes
The idea of error codes is to allow easy identification of specific errors and map them to a proper documentation.
Error codes consist of a _scope_ and a numeric part. They follow the pattern `/^([a-zA-Z0-9]+)-/`.

Example: `code='ASYNC-01005'` produces `scope='ASYNC'`.

To better group error codes by their meaning, we suggest the following numbering scheme:

* Use 5 digit numbers for error codes to have enough spacing
* Use the `10000 - 89999` range for error codes that can be solved immediately by the user.
* Use the `90000 - 99999` range for error codes that are caused by internal limitations or violated assumptions.

To generate an overview of all errors inside all packages with their documentation, you can run:
```
npx ts-node scripts/extract-errors.ts <path to /packages>
```
This will generate an `error-overview.md` file in the current directory.

Remembery you can also use the `metadata` of an error to provide additional information.

### API

#### CommonErrors
This enum provides common error codes that can be used throughout all packages for errors that do not need individual tracking.

#### MongoshBaseError
All errors inherit from the abstract `MongoshBaseError` which in turn inherits from `Error`.

All `MongoshBaseError`s have the following properties:
* `name`: _inherited from `Error`_. The name of the error, corresponding to the concrete class name.
* `message`: _inherited from `Error`_. Descriptive message of the error.
* `code`: _optional_. A unique identification code given when constructing the error.
* `scope`: _optional_. The scope is automatically extracted from a given `code`.
* `metadata`: _optional_. Additional metadata for further analysis of the error cause.

#### MongoshWarning(msg, code?, metadata?)
This error is used to give user a warning about the current execution.
__args:__
- __msg:__ type string. Describes the warning.
- __code:__ *optional* type string. Unique identification code of the warning.
- __metadata:__ *optional* type Object. Additional metadata for further analysis.

#### MongoshUnimplementedError(msg, code?, metadata?)
This error is used to API endpoints that are not yet implemented. 
__args:__
- __msg:__ type string. Describes what is not yet implemented.
- __code:__ *optional* type string. Unique identification code of the error.
- __metadata:__ *optional* type Object. Additional metadata for further analysis.

#### MongoshRuntimeError(msg, code?, metadata?)
Used for errors in evaluation, specific to MongoDB Shell. Should not be used for
JavaScript runtime errors.

__args:__
- __msg:__ type string. Describes what caused the error and a potential fix, if
  avaialable.
- __code:__ *optional* type string. Unique identification code of the error.
- __metadata:__ *optional* type Object. Additional metadata for further analysis.

#### MongoshInternalError(msg, metadata?)
Used for rare cases when MongoDB Shell is not able to parse and evaluate the
input.
__args:__
- __msg:__ type string. Describes error in detail, so the user can better report
  it.
- __metadata:__ *optional* type Object. Additional metadata for further analysis.

`e.message` will be appended with the following information:
```
This is an error inside Mongosh. Please file a bug report for the MONGOSH project here: https://jira.mongodb.org.
```

_Note: The error code will automatically be set to `CommonErrors.UnexpectedInternalError`._

#### MongoshInvalidInputError(msg, code?, metadata?)
This error is used for invalid MongoDB input. This should not be used for
JavaScript syntax errors, but rather for those specific to MongoDB.
__args:__
- __msg:__ type string. Describes error in detail, providing current invalid
  input, and a fix, if available. 
- __code:__ *optional* type string. Unique identification code of the error.
- __metadata:__ *optional* type Object. Additional metadata for further analysis.

#### MongoshDeprecatedError(msg, metadata?)
This error is used when using a method or property that has been deprecated and was therefore already removed.
__args:__
- __msg:__ type string. Describes error in detail, providing current invalid
  input, and a fix, if available. 
- __metadata:__ *optional* type Object. Additional metadata for further analysis.

_Note: The error code will automatically be set to `CommonErrors.Deprecated`._

#### MongoshCommandFailed(msg, metadata?)
This error is used when running a database command unexpectedly failed but can be tried using `runCommand` to get more details.
This should only be used when the result of a command returns with `{ok: 0}`.
__args:__
- __msg:__ type string. Describes error in detail, providing current invalid
  input, and a fix, if available. 
- __metadata:__ *optional* type Object. Additional metadata for further analysis.

_Note: The error code will automatically be set to `CommonErrors.CommandFailed`._

## Installation
```shell
npm install -S @mongosh/errors
```

[mongosh]: https://github.com/mongodb-js/mongosh

