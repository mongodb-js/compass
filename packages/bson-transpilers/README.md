# BSON-Transpilers
[![npm version][1]][2] [![build status][3]][4]
[![downloads][5]][6]

Transpilers for building BSON documents in any language. Current support
provided for `shell` and `javascript` as inputs. `java`, `c#` and `python` as
outputs.

# Usage

```js
const transpiler = require('bson-transpilers');

const input = 'javascript';
const output = 'java';

const string =`
{ item: "book", qty: Binary(Buffer.from("5")), tags: ["red", "blank"], dim_cm: [14, Int32("81")] }`;

try {
  const compiledString = transpiler[input][output].compile(string);
  console.log(compiledCode);
  // new Document("item", "book").append("qty", new Binary("5".getBytes("UTF-8")))
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

### importsString = transpiler\[inputLang\]\[outputLang\].getImports()
Output a string containing the set of import statements for the generated code
to compile. These are all the packages that the compiled code could use so that
the transpiler output will be runnable.

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
#### BsonTranspilersRangeError
###### code: E_BSONTRANSPILERS_RANGE
If an argument has been passed that is not in the range of expected values.

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
