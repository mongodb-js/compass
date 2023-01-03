# BSON-Transpilers
[![npm version][1]][2] [![build status][3]][4]
[![downloads][5]][6]

Transpilers for building BSON documents in any language. Current support
provided for `shell` `javascript` and `python` as inputs. `java`, `c#`, `node`, `shell`, `python`, `ruby` and `go` as outputs.

> ⚠️&nbsp;&nbsp;`shell` output produces code that is compatible only with legacy `mongo` shell not the new `mongosh` shell. See [COMPASS-4930](https://jira.mongodb.org/browse/COMPASS-4930) for some additional context

See also the original presentation: https://drive.google.com/file/d/1jvwtR3k9oBUzIjL4z_VtpHvdWahfcjTK/view

# Usage

```js
const transpiler = require('bson-transpilers');

const input = 'javascript';
const output = 'java';

const string =`
{ item: "book", qty: Int32(10), tags: ["red", "blank"], dim_cm: [14, Int32("81")] }`;

try {
  const compiledString = transpiler[input][output].compile(string);
  console.log(compiledCode);
  // new Document("item", "book").append("qty", 10)
  // .append("tags", Arrays.asList("red", "blank"))
  // .append("dim_cm", Arrays.asList(14L, 81")))
} catch (error) {
  console.error(error);
}
```

## API
### compiledString = transpiler\[inputLang\]\[outputLang\].compile(codeString)
Output a compiled string given input and output languages.
- __inputLang:__ Input language of the code string. `shell` and `javascript`
  are currently supported.
- __outputLang:__ The language you would like the output to be. `java`,
  `python`, `shell`, `javascript`, and `csharp` are currently supported.
- __codeString:__ The code string you would like to be compiled to your
  selected output language.

### importsString = transpiler\[inputLang\]\[outputLang\].getImports(mode, driverSyntax)
Output a string containing the set of import statements for the generated code
to compile. These are all the packages that the compiled code could use so that
the transpiler output will be runnable.
- __inputLang:__ Input language of the code string. `shell` and `javascript`
  are currently supported.
- __outputLang:__ The language you would like the output to be. `java`,
  `python`, `shell`, `javascript`, and `csharp` are currently supported.
- __mode:__ Either 'Query' for the `.find()` method or 'Pipeline' for `.aggregate()`.
- __driverSyntax:__ Whether or not you want to include Driver Syntax into your output string.

### catch (error)
Any transpiler errors that occur will be thrown. To catch them, wrap the
`transpiler` in a `try/catch` block.
- __error.message:__ Message `bson-transpilers` will send back letting you know
  the transpiler error.
- __error.stack:__ The usual error stacktrace.
- __error.code:__ [Error code]() that `bson-transpilers` adds to the error object to
  help you distinguish error types.
- __error.line:__ If it is a syntax error, will have the line.
- __error.column:__ If it is a syntax error, will have the column.
- __error.symbol:__ If it is a syntax error, will have the symbol associated with the error.


### State

The `CodeGenerationVisitor` class manages a global state which is bound to the `argsTemplate` functions.  This state is intended to be used as a solution for the `argsTemplate` functions to communicate with the `DriverTemplate` function.  For example:

```yaml
ObjectIdEqualsArgsTemplate: &ObjectIdEqualsArgsTemplate !!js/function >
    (_) => {
        this.oneLineStatement = "Hello World";
        return '';
    }

DriverTemplate: &DriverTemplate !!js/function >
    (_spec) => {
      return this.oneLineStatement;
    }
```

The output of the driver syntax for this language will be the one-line statement `Hello World`.

#### DeclarationStore
A more practical use-case of state is to accumulate variable declarations throughout the `argsTemplate` to be rendered by the `DriverTemplate`.  That is, the motivation for using `DeclarationStore` is to prepend the driver syntax with variable declarations rather than using non-idiomatic solutions such as closures.

The `DeclarationStore` class maintains an internal state concerning variable declarations.  For example,

```javascript
// within the args template
(arg) => {
  return this.declarations.add("Temp", "objectID", (varName) => {
    return [
      `${varName}, err := primitive.ObjectIDFromHex(${arg})`,
      'if err != nil {',
      '   log.Fatal(err)',
      '}'
    ].join('\n')
  })
}
```

Note that each use of the same variable name will result in an increment being added to the declaration statement. For example, if the variable name `objectIDForTemp` is used two times the resulting declaration statements will use `objectIDForTemp` for the first declaration and `objectID2ForTemp` for the second declaration.  The `add` method returns the incremented variable name, and is therefore what would be expected as the right-hand side of the statement defined by the `argsTemplate` function.

The instance of the `DeclarationStore` constructed by the transpiler class is passed into the driver, syntax via state, for use:

```javascript
(spec) => {
  const comment = '// some comment'
  const client = 'client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(cs.String()))'
  return "#{comment}\n\n#{client}\n\n${this.declarations.toString()}"
}
```

### Errors
There are a few different error classes thrown by `bson-transpilers`, each with
their own error code:

#### BsonTranspilersArgumentError
###### code: E_BSONTRANSPILERS_ARGUMENT
This will occur when you're using a method with a wrong number of arguments, or
the arguments are of the wrong type.
For example, `ObjectId().equals()` requires one argument and it will throw if
anything other than one argument is provided:

```javascript
// ✘: this will throw a BsonTranspilersArgumentError.
ObjectId().equals(ObjectId(), ObjectId());

// ✔: this won't throw
ObjectId().equals(ObjectId());
```

```javascript
// ✘: this will throw a BsonTranspilersArgumentError.
ObjectId({});

// ✔: this won't throw
ObjectId();
```

#### BsonTranspilersAttributeError
###### code: E_BSONTRANSPILERS_ATTRIBUTE
Will be thrown if an invalid method or property is used on a BSON object. For
example, since `new DBRef()` doesn't have a method `.foo()`, transpiler will
throw:

```javascript
// ✘: method foo doesn't exist, so this will throw a BsonTranspilersAttributeError .
new DBRef('newCollection', new ObjectId()).foo()

// ✔: this won't throw, since .toString() method exists
new DBRef('newCollection', new ObjectId()).toString(10)
```

#### BsonTranspilersSyntaxError
###### code: E_BSONTRANSPILERS_SYNTAX
This will throw if you have a syntax error. For example missing a colon in
Object assignment, or forgetting a comma in array definition:

```javascript
// ✘: this is not a proper object definition; will throw E_SYNTAX_GENERIC
{ key 'beep' }

// ✘: this is not a proper array definition, will throw E_SYNTAX_GENERIC
[ 'beep'; 'boop' 'beepBoop' ]

// ✔: neither of these will throw
{ key: 'beep' }
[ 'beep', 'boop', 'beepBoop' ]
```

#### BsonTranspilersTypeError
###### code: E_BSONTRANSPILERS_TYPE
This error will occur if a symbol is treated as the wrong type. For example, if
a non-function is called:

```javascript
// ✘: MAX_VALUE is a constant, not a function
Long.MAX_VALUE()

// ✔: MAX_VALUE without a call will not throw
Long.MAX_VALUE
```
#### BsonTranspilersUnimplementedError
###### code: E_BSONTRANSPILERS_UNIMPLEMENTED
If there is a feature in the input code that is not currently supported by the
transpiler.

#### BsonTranspilersRuntimeError
###### code: E_BSONTRANSPILERS_RUNTIME
A generic runtime error will be thrown for all errors that are not covered by the
above list of errors. These are usually constructor requirements, for example
when using a `RegExp()` an unsupported flag is given:

```javascript
// ✘: these are not proper 'RegExp()' flags, a BsonTranspilersRuntimeError will be thrown.
new RegExp('ab+c', 'beep')

// ✔: 'im' are proper 'RegExp()' flags
new RegExp('ab+c', 'im')
```

#### BsonTranspilersInternalError
###### code: E_BSONTRANSPILERS_INTERNAL
In the case where something has gone wrong within compilation, and an error has
occured. If you see this error, please create [an issue](https://github.com/mongodb-js/bson-transpilers/issues) on Github!

# Install
```shell
npm install -S bson-transpilers
```

## Contributing
Head over to the readme [on contributing](./CONTRIBUTING.md) to find out more
information on project structure and setting up your environment.

# Authors
- [aherlihy](https://github.com/aherlihy) - Anna Herlihy <herlihyap@gmail.com>
- [alenakhineika](https://github.com/alenakhineika) - Alena Khineika <alena.khineika@mongodb.com>
- [lrlna](github.com/lrlna) - Irina Shestak <shestak.irina@gmail.com>

# License
[Apache-2.0](https://tldrlegal.com/license/apache-license-2.0-(apache-2.0))

[1]: https://img.shields.io/npm/v/bson-transpilers.svg?style=flat-square
[2]: https://npmjs.org/package/bson-transpilers
[3]: https://img.shields.io/travis/mongodb-js/bson-transpilers/master.svg?style=flat-square
[4]: https://travis-ci.com/mongodb-js/bson-transpilers
[5]: http://img.shields.io/npm/dm/bson-transpilers.svg?style=flat-square
[6]: https://npmjs.org/package/bson-transpilers
