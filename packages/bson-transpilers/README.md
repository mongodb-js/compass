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
{ item: "book", qty: Binary(Buffer.from("5")), tags: ["red", "blank"], dim_cm: [14, Int32("81")] }`

const compiledString = compiler[input][output](string);
console.log(compiledCode)
// new Document().append("item", "book").append("qty", new Binary("5".getBytes("UTF-8")))
// .append("tags", Arrays.asList("red", "blank"))
// .append("dim_cm", Arrays.asList(new java.lang.Long("14"), new java.lang.Integer("81")))  
```

## API
### compiledString = compiler.inputLang.outputLang(codeString)
Output a compiled string given input and output languages.
- __inputLang:__ Input language of the code string. `shell` and `javascript` are currently supported.
- __outputLang:__ The language you would like the output to be. `java`, `python` and `C#` are currently supported.
- __codeString:__ The code string you would like to be compiled to your selected output language.

# Install
```shell
npm install -S bson-compilers
```

## Contributing
`bson-compilers` uses [antlr](https://github.com/antlr/antlr4/blob/master/doc/javascript-target.md) to help create an AST. As `antlr` is written in Java, you will need to set up a few tools before being able to compile this locally. 

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
