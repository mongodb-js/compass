# BSON-Compilers
[![npm version][1]][2] [![build status][3]][4]
[![downloads][5]][6]

Transpilers for building BSON documents in any language. Current support
provided for `shell` and `javascript` as inputs. `java`, `c#` and `python` as
outputs.

# Usage

```js
const compiler = require('bson-compilers');

const input = 'javascript';
const output = 'java';

const string =`
{ item: "book", qty: Binary(Buffer.from("5")), tags: ["red", "blank"], dim_cm: [14, Int32("81")] }`;

try {
  const compiledString = compiler[input][output](string);
  console.log(compiledCode);
  // new Document("item", "book").append("qty", new Binary("5".getBytes("UTF-8")))
  // .append("tags", Arrays.asList("red", "blank"))
  // .append("dim_cm", Arrays.asList(14L, 81")))
} catch (error) {
  console.error(error);
}
```

## API
### compiledString = compiler\[inputLang\]\[outputLang\](codeString)
Output a compiled string given input and output languages.
- __inputLang:__ Input language of the code string. `shell` and `javascript`
  are currently supported.
- __outputLang:__ The language you would like the output to be. `java`,
  `python`, `shell`, `javascript`, and `csharp` are currently supported.
- __codeString:__ The code string you would like to be compiled to your
  selected output language.

### importsString = compiler.imports[outputLang]
Output a string containing the set of import statements for the generated code
to compile. These are all the packages that the compiled code could use so that
the compiler output will be runnable. May include unused imports if the input
string doesn't use a specific type.

### catch (error)
Any compiler errors that occur will be thrown. To catch them, wrap the
`compiler` in a `try/catch` block.
- __error.message:__ Message `bson-compilers` will send back letting you know
  the compiler error.
- __error.stack:__ The usual error stacktrace.
- __error.code:__ [Error code]() that `bson-compilers` adds to the error object to
  help you distinguish error types.
- __error.line:__ If it is a syntax error, will have the line.
- __error.column:__ If it is a syntax error, will have the column.
- __error.symbol:__ If it is a syntax error, will have the symbol associated with the error.

### Errors
There are a few different error classes thrown by `bson-compilers`, each with 
their own error code:

#### BsonCompilersArgumentError
###### code: E_BSONCOMPILERS_ARGUMENT
This will occur when you're using a method with a wrong number of arguments, or
the arguments are of the wrong type.
For example, `ObjectId().equals()` requires one argument and it will throw if
anything other than one argument is provided:

```javascript
// ✘: this will throw a BsonCompilersArgumentError.
ObjectId().equals(ObjectId(), ObjectId());

// ✔: this won't throw
ObjectId().equals(ObjectId());
```

```javascript
// ✘: this will throw a BsonCompilersArgumentError.
ObjectId({});

// ✔: this won't throw
ObjectId();
```

#### BsonCompilersAttributeError
###### code: E_BSONCOMPILERS_ATTRIBUTE
Will be thrown if an invalid method or property is used on a BSON object. For
example, since `new DBRef()` doesn't have a method `.foo()`, compiler will
throw:

```javascript
// ✘: method foo doesn't exist, so this will throw a BsonCompilersAttributeError .
new DBRef('newCollection', new ObjectId()).foo()

// ✔: this won't throw, since .toString() method exists
new DBRef('newCollection', new ObjectId()).toString(10)
```

#### BsonCompilersSyntaxError
###### code: E_BSONCOMPILERS_SYNTAX 
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

#### BsonCompilersTypeError
###### code: E_BSONCOMPILERS_TYPE
This error will occur if a symbol is treated as the wrong type. For example, if
a non-function is called:

```javascript
// ✘: MAX_VALUE is a constant, not a function
Long.MAX_VALUE()

// ✔: MAX_VALUE without a call will not throw
Long.MAX_VALUE
```
#### BsonCompilersRangeError
###### code: E_BSONCOMPILERS_RANGE
If an argument has been passed that is not in the range of expected values.

#### BsonCompilersUnimplementedError
###### code: E_BSONCOMPILERS_UNIMPLEMENTED
If there is a feature in the input code that is not currently supported by the 
compiler. 

#### BsonCompilersRuntimeError
###### code: E_BSONCOMPILERS_RUNTIME
A generic runtime error will be thrown for all errors that are not covered by the
above list of errors. These are usually constructor requirements, for example 
when using a `RegExp()` an unsupported flag is given:

```javascript
// ✘: these are not proper 'RegExp()' flags, a BsonCompilersRuntimeError will be thrown.
new RegExp('ab+c', 'beep')

// ✔: 'im' are proper 'RegExp()' flags
new RegExp('ab+c', 'im')
```

#### BsonCompilersInternalError
###### code: E_BSONCOMPILERS_INTERNAL
In the case where something has gone wrong within compilation, and an error has 
occured. If you see this error, please create [an issue](https://github.com/mongodb-js/bson-compilers/issues) on Github!

# Install
```shell
npm install -S bson-compilers
```

## Contributing
`bson-compilers` uses
[antlr](https://github.com/antlr/antlr4/blob/master/doc/javascript-target.md)
to help create an AST. As `antlr` is written in Java, you will need to set up a
few tools before being able to compile this locally. 

Make sure you have Java installed:
```shell
$ brew cask install java
```

Download `antlr`:
```shell
$ cd /usr/local/lib && curl -O http://www.antlr.org/download/antlr-4.7.1-complete.jar
```

You will then need to add it to your `$CLASSPATH`:
```shell
$ export CLASSPATH=".:/usr/local/lib/antlr-4.7.1-complete.jar:$CLASSPATH"
```

Alias `antlr4` and `grun`:
```shell
$ alias antlr4='java -Xmx500M -cp "/usr/local/lib/antlr-4.7.1-complete.jar:$CLASSPATH" org.antlr.v4.Tool' && alias grun='java org.antlr.v4.gui.TestRig'
```

Then compile and run tests locally with:
```shell
$ npm run compile && npm run test
```

# Authors
- [aherlihy](https://github.com/aherlihy) - Anna Herlihy <herlihyap@gmail.com>
- [alenakhineika](https://github.com/alenakhineika) - Alena Khineika <alena.khineika@mongodb.com>
- [lrlna](github.com/lrlna) - Irina Shestak <shestak.irina@gmail.com>

# License
[Apache-2.0](https://tldrlegal.com/license/apache-license-2.0-(apache-2.0))

[1]: https://img.shields.io/npm/v/bson-compilers.svg?style=flat-square
[2]: https://npmjs.org/package/bson-compilers
[3]: https://img.shields.io/travis/mongodb-js/bson-compilers/master.svg?style=flat-square
[4]: https://travis-ci.com/mongodb-js/bson-compilers
[5]: http://img.shields.io/npm/dm/bson-compilers.svg?style=flat-square
[6]: https://npmjs.org/package/bson-compilers
