# scout-client

A client for [scout-server](http://github.com/10gen/scout) that works in the browser or a server.

Want to see what it can do? [Check out `./examples`](tree/dev/examples).

```
npm install --save scout-client
```

## API

```javascript
var scout = require('scout-client')([opts]);
```

#### Parameters

- `opts` (optional, Object) ...
    - `scout` (String) ... Where scout-server is running [Default `http://localhost:29017`].
    - `seed` (String) ... Hostport of mongodb instance [Default: `localhost:27017`].
    - `auth` (Object) ... Auth spec [Default `{}`].

### resource

#### scout.instance (opts, fn)

![production](http://b.repl.ca/v1/stability-production-green.png)

Get details of the instance you're currently connected to
like database_names, results of the hostInfo and buildInfo mongo commands.


##### Parameters

- `opts` (optional, Object) ... Placeholder for future options
- `fn` (optional, Function) ... A response callback `(err, data)` 


#### scout.deployments (opts, fn)

![production](http://b.repl.ca/v1/stability-production-green.png)

List all deployments this scout-server instance has connected to.



##### Parameters

- `opts` (optional, Object) ... Placeholder for future options
- `fn` (optional, Function) ... A response callback `(err, data)` 


#### scout.database (name, opts, fn)

![production](http://b.repl.ca/v1/stability-production-green.png)

List collection names and stats.



##### Parameters

- `name` (required, String) 
- `opts` (optional, Object) ... Placeholder for future options
- `fn` (optional, Function) ... A response callback `(err, data)` 


#### scout.collection (ns, opts, fn)

![production](http://b.repl.ca/v1/stability-production-green.png)

Collection stats



##### Parameters

- `ns` (required, String) ... A namespace string, eg `#{database_name}.#{collection_name}`
- `opts` (optional, Object) ... Placeholder for future options
- `fn` (optional, Function) ... A response callback `(err, data)` 


#### scout.index (ns, name, opts, fn)

![development](http://b.repl.ca/v1/stability-development-yellow.png)

Index details



##### Parameters

- `ns` (required, String) ... A namespace string, eg `#{database_name}.#{collection_name}`
- `name` (required, String) ... The index name
- `opts` (optional, Object) ... Placeholder for future options
- `fn` (optional, Function) ... A response callback `(err, data)` 


#### scout.document (ns, _id, opts, fn)

![development](http://b.repl.ca/v1/stability-development-yellow.png)

Work with a single document.



##### Parameters

- `ns` (required, String) ... A namespace string, eg `#{database_name}.#{collection_name}`
- `_id` (required, String) ... The document's `_id` value
- `opts` (optional, Object) ... Placeholder for future options
- `fn` (optional, Function) ... A response callback `(err, data)` 


### query

#### scout.find (ns, opts, fn)

![production](http://b.repl.ca/v1/stability-production-green.png)

Run a query on `ns`.



##### Parameters

- `ns` (required, String) ... A namespace string, eg `#{database_name}.#{collection_name}`
- `opts` (optional, Object) ... Placeholder for future options
    - `query` (Object) ... default `{}`
    - `limit` (Number) ... default `10`, max 200
    - `skip` (Number) ... default 0
    - `explain` (Boolean) ... Return explain instead of documents default `false`
    - `sort` (Object) ... `{key: (1|-1)}` spec default `null`
    - `fields` (Object) ... @todo
    - `options` (Object) ... @todo
    - `batchSize` (Number) ... @todo

- `fn` (optional, Function) ... A response callback `(err, data)` 


#### scout.count (ns, opts, fn)

![production](http://b.repl.ca/v1/stability-production-green.png)

Run a count on `ns`.



##### Parameters

- `ns` (required, String) ... A namespace string, eg `#{database_name}.#{collection_name}`
- `opts` (optional, Object) ... 
    - `query` (Object) ... default `{}`
    - `limit` (Number) ... default `10`, max 200
    - `skip` (Number) ... default 0
    - `explain` (Boolean) ... Return explain instead of documents default `false`
    - `sort` (Object) ... `{key: (1|-1)}` spec default `null`
    - `fields` (Object) ... @todo
    - `options` (Object) ... @todo
    - `batchSize` (Number) ... @todo

- `fn` (optional, Function) ... A response callback `(err, data)` 


#### scout.aggregate (ns, pipeline, opts, fn)

![development](http://b.repl.ca/v1/stability-development-yellow.png)

Run an aggregation pipeline on `ns`.


##### Examples

- [Run an aggregation and chart it ](http://codepen.io/imlucas/pen/BHvLE)

##### Parameters

- `ns` (required, String) ... A namespace string, eg `#{database_name}.#{collection_name}`
- `pipeline` (required, Array) 
- `opts` (optional, Object) ... 
    - `explain` (Boolean) ... @todo
    - `allowDiskUse` (Boolean) ... @todo
    - `cursor` (Object) ... @todo

- `fn` (required, Function) ... A response callback `(err, data)` 


#### scout.sample (ns, opts, fn)

![development](http://b.repl.ca/v1/stability-development-yellow.png)

Use [resevoir sampling](http://en.wikipedia.org/wiki/Reservoir_sampling) to
get a slice of documents from a collection efficiently.



##### Parameters

- `ns` (required, String) ... A namespace string, eg `#{database_name}.#{collection_name}`
- `opts` (optional, Object) ... 
    - `size` (Number) ... The number of samples to obtain default `5`
    - `query` (Object) ... Restrict the sample to a subset default `{}` 

- `fn` (required, Function) ... A response callback `(err, data)` 


#### scout.random (ns, opts, fn)

![development](http://b.repl.ca/v1/stability-development-yellow.png)

Convenience to get 1 document via `Client.prototype.sample`.



##### Parameters

- `ns` (required, String) ... A namespace string, eg `#{database_name}.#{collection_name}`
- `opts` (optional, Object) ... 
    - `query` (Object) ... Restrict the sample to a subset default `{}` 

- `fn` (required, Function) ... A response callback `(err, data)` 


