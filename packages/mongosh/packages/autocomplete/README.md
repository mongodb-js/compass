# `@mongosh/autocomplete`

Package for [MongoDB Shell](mongosh)

## Usage

```js
const autocomplete = require('@mongosh/autocomplete');
const serverVersion = '4.4.0';
const line = 'db.coll.fin';
const completions = autocomplete(serverVersion, line);
if (!completions || !completions.length) {
  return [];
}
const entries = completions[0].map((completion) => {
  return {
    completion
  };
});
```
### API

#### completions = autocomplete(serverVersion, line)
__serverVersion:__ current version of MongoDB
__line:__ current line to autcomplete

Returns an array of completions, and the line we were autocompleting. For
example:

```js
const autocomplete = require('@mongosh/autocomplete');
const serverVersion = '4.4.0';
const line = 'db.coll.re';
const completions = autocomplete(serverVersion, line);
// returns:
// [
//   [ 'db.coll.renameCollection', 'db.coll.replaceOne', 'db.coll.reIndex' ],
//   'db.coll.re' 
// ]
```

Autocomplete is based on currently implemeted APIs in [@mongosh/shell-api](https://www.npmjs.com/package/@mongosh/shell-api)


## Installation
```shell
npm install -S @mongosh/errors
```

[mongosh]: https://github.com/mongodb-js/mongosh
