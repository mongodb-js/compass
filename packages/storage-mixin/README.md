# storage-mixin [![][travis_img]][travis_url] [![][npm_img]][npm_url] [![][inch_img]][inch_url]

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

The following backends are currently supported: `local`, `disk`, `remote`, `null`.
The default is `local`.

#### `local` Backend

Stores objects in local storage of the browser. Only works in a browser context.
The backend uses the [`localforage`][localforage] npm module under the hood and
supports IndexedDB, WebSQL and localStorage drivers. A separate instance of
the store is created for each `namespace`.

Additional Options

`driver`
: The driver to be passed on to `localforage`. One of `INDEXEDDB`, `LOCALSTORAGE` or `WEBSQL`. The default is `INDEXEDDB`.


#### `disk` Backend

Stores objects as `.json` files on disk at location `<basepath>/<namespace>/<id>.json`.
Only works in a node.js / server context. `<basepath>` is provided as option.
The `<namespace>` is set on the model directly, and the `<id>` is the property
of the model specified by `idAttribute`. The first example on this page would
be stored as:

```
/tmp/StorableModels/Apollo 13.json
```

Additional Options

`basepath`
: The base path for file storage. The default is `.`.

#### `remote` Backend

This is a wrapper for [ampersand-sync][ampersand-sync], that stores and
retrieves models to/from a remote server via asynchronous ajax / xhr requests.
Pass in the [`url`][ampersand-model-url] value as an option or set it
directly on the model.

Additional Options

`url`
: The url to fetch the model/collection, see [ampersand-model#url][ampersand-model-url].

#### `null` Backend

This backend exists mostly for debugging and testing purposes. It does not
store anything but will return with successful callbacks on all method calls.
For reads, it will return an empty object `{}` for models, or an empty array
`[]` for collections.


## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/storage-mixin.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/storage-mixin
[npm_img]: https://img.shields.io/npm/v/storage-mixin.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/storage-mixin
[inch_img]: http://inch-ci.org/github/mongodb-js/storage-mixin.svg?branch=master
[inch_url]: http://inch-ci.org/github/mongodb-js/storage-mixin
[ampersand-sync]: https://github.com/AmpersandJS/ampersand-sync
[ampersand-save]: https://ampersandjs.com/docs/#ampersand-model-save
[ampersand-model-url]: https://github.com/AmpersandJS/ampersand-model#url-modelurl-or-modelurl
[localforage]: http://mozilla.github.io/localForage/
