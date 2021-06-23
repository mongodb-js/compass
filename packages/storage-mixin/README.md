# storage-mixin [![][npm_img]][npm_url]

Persist [Ampersand.js](https://ampersandjs.com/) models and collections to various storage backends.


## Installation

```
npm install --save storage-mixin
```

## Usage

Use this mixin with any existing model and collection to easily persist
them to a number of different storage backends. The model needs
- the mixin
- `idAttribute` value (Ampersand's default is `id`)
- `namespace` value
- `storage` key to pass options to the mixin (see [Options](#usage-options))

```js
var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');

var Spaceship = Model.extend(storageMixin, {
  idAttribute: 'name',
  namespace: 'StorableModels',
  storage: {
    backend: 'disk',
    basepath: '/tmp'
  },
  props: {
    // your property definitions, will be persisted to storage
    name: ['string', false, ''],
    warpDrive: ['boolean', false, false]
  },
  session: {
    // your session properties, will _not_ be persisted to storage
  }
  // ... other model methods
});
```

Now you can call call the [`.save()`][ampersand-save] method on instantiated models.

```js
var model = new StorableModel();
model.save({name: 'Apollo 13', warpDrive: false});
```

### Options

Options are passed to the storage mixin via the `storage` key. If you only
want to choose which backend to use and don't need to pass any further options
along, the `storage` key can be a string with the backend name.

```js
var StorableModel = Model.extend(storageMixin, {
  storage: 'disk',   // use disk storage with default basepath `.`
  props: {
    // ...
  }
});
```

If you want to further customize the storage mixin, use an object and provide
additional options. The `backend` value is required, all other values are
optional and backend-dependent.

```js
var StorableModel = Model.extend(storageMixin, {
  storage: {    // use disk storage with a custom basepath
    backend: 'disk',   
    basepath: '/tmp/myapp/storage'    
  props: {
    // ...
  }
});
```

### Backends

The following backends are currently supported: `local`, `disk`, `remote`, `null`,
`secure`, `splice`.

The default is `local`.

#### `local` Backend

Stores objects in local storage of the browser. Only works in a browser context.
The backend uses the [`localforage`][localforage] npm module under the hood and
supports IndexedDB, WebSQL and localStorage drivers. A separate instance of
the store is created for each `namespace`.

###### Additional Options

`driver`
: The driver to be passed on to `localforage`. One of `INDEXEDDB`, `LOCALSTORAGE`
or `WEBSQL`. The default is `INDEXEDDB`.

`appName`
: The name of the IndexedDB database (not the data store inside the database,
  which is the model's `namespace`). Most users will never see this, but it's
  best practice to use your application name here. Default is `storage-mixin`.


#### `disk` Backend

Stores objects as `.json` files on disk. Only works in a node.js / server
context, or in Electron renderer process where `remote` module is available
to get access to the `fs` module.

The file location is `<basepath>/<namespace>/<id>.json`. `<basepath>` is
provided as option. The `<namespace>` is set on the model directly, and the
`<id>` is the property of the model specified by `idAttribute`. The first
example on this page would be stored as:

```
/tmp/StorableModels/Apollo 13.json
```

###### Additional Options

`basepath`
: The base path for file storage. The default is `.`.

#### `remote` Backend

This is a wrapper for [ampersand-sync][ampersand-sync], that stores and
retrieves models to/from a remote server via asynchronous ajax / xhr requests.
Pass in the [`url`][ampersand-model-url] value as an option or set it
directly on the model.

###### Additional Options

`url`
: The url to fetch the model/collection, see [ampersand-model#url][ampersand-model-url].

#### `null` Backend

This backend exists mostly for debugging and testing purposes. It does not
store anything but will return with successful callbacks on all method calls.
For reads, it will return an empty object `{}` for models, or an empty array
`[]` for collections.

#### `secure` Backend

The `secure` backend wraps the [`keytar`][keytar] module to persist data into
a secure keychain, keyring or password manager (works for OS X, Linux, Windows).
There are some limitations though as the interface does not allow to list all
keys in a given namespace. Therefore, to fetch a collection, it has to be
pre-populated with models containing the ids.

```js
// this won't work !
var collection = new StorableCollection();
collection.fetch();

// do this instead
var collection = new StorableCollection([
  {id: 'some id'}, {id: 'some other id'}, {id: 'third id'}
], {parse: true});
collection.fetch();
```

The static `.clear()` method that other storage backends possess is also
a no-op in the `secure` backend for the same reason. Keys have to be deleted
manually.


###### Additional Options

`appName`
: Entries in the keychain have a key of `<appName>/<namespace>`. As this is
  visible to the user, you should use your application name here. Default
  is `storage-mixin`.

#### `splice` Backend

This is a hybrid backend that consists of a `local` and `secure` backend
under the hood. It also receives a `secureCondition` function as an optional
argument that takes a `value` and `key` and returns whether or not this key
should be stored in the `secure` or `local` backend. On retrieval, it merges
the two results from both backends together to form a complete object again.

This is particularly useful to store user-related data where some fields contain
sensitive information and should not be stored as clear text, e.g. passwords.


###### Additional Options

`appName`
: Passed to both the `local` and `secure` backends, that acts as a global
scope (e.g. database name in IndexedDB, prefix in keychain keys). Use your
application name here. Default is `storage-mixin`.

`secureCondition`
: Function that decides which keys/values of a model should be stored in the
`secure` backend vs. the `local` backend. The function takes a value and key
and must return `true` for the keys that need to be stored securely. Default
is:
```js
function(val, key) {
  return key.match(/password/i);
}
```

###### Example

```js
var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');

var User = Model.extend(storageMixin, {
  idAttribute: 'id',
  namespace: 'Users',
  storage: {
    backend: 'splice',
    appName: 'My Cool App',
    secureCondition: function(val, key) {
      return key.match(/password/i);
    }
  },
  props: {
    id: 'string',            // stored in `local`
    name: 'string',          // stored in `local`
    email: 'string',         // stored in `local`
    lastLogin: 'date',       // stored in `local`
    password: 'string',      // stored in `secure`
    oldPassword: 'string'    // stored in `secure`
  }
});

```

[npm_img]: https://img.shields.io/npm/v/storage-mixin.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/storage-mixin
[ampersand-sync]: https://github.com/AmpersandJS/ampersand-sync
[ampersand-save]: https://ampersandjs.com/docs/#ampersand-model-save
[ampersand-model-url]: https://github.com/AmpersandJS/ampersand-model#url-modelurl-or-modelurl
[localforage]: http://mozilla.github.io/localForage/
[keytar]: https://www.npmjs.com/package/keytar
