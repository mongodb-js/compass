# Streams and Ampersand.js

1. Start mongodb in a background window.
2. Open a new terminal window and run the following to start up scout-server: `cd ~/scout/scout-server; npm start;`
3. Open scout-ui in your editor of choice: `cd ~/scout/scout-ui; subl -a ./;`

```javascript
// It all starts with requiring some libraries.
//
// scout-brain is currently a dumping ground and will be broken up into
// several smaller modules as soon as we can.
var brain = require('../../../scout-brain');

// scout-client provides us with a nice wrapper around the scout-server
// REST and socket.io API's.
var client = require('../../../scout-client')();

// mongodb-schema provides us with a very convenient `Schema` model
// we can extend from that means we have a nice and simple implementation:
// we just need to fill out the method for providing it data.
var Schema = require('mongodb-schema').Schema;

// Our debugging philosophy is the same as node.js core, chromium and unix:
// when it comes to logging there are no levels, only `debug()` and it should
// be nice and only output messages when you want them.  If there is an error,
// you should throw an error.  More info: http://npm.im/debug
var debug = require('debug')('scout-streams-example');

var SampledSchema = Schema.extend({
  fetch: function() {
    // Create a new readable stream that will feed us documents sampled from
    // the namespace `this.ns`.  Under the hood, scout-client implements this
    // as a socket.io stream. This way as soon as a document is available from
    // the sample it will be on it's way to being analyzed.
    var docs = client.sample(this.ns, {size: 5, query: {}, fields: null});

    // mongodb-schema provides us with a convenient `stream()` method
    // that provides a [transform](https://github.com/substack/stream-handbook#transform)
    // that will update `this.fields` as new documents are delivered to it.
    var transformer = this.stream();

    // Streams don't do anything until they're told to.  Calling `.sample()`
    // just prepares the state and won't start using the network until
    // another stream is connected to it, most often via `.pipe()`:
    docs.pipe(transformer);

    // Finally, when we've finished analyzing the sample, we trigger a `sync`
    // event so anyone watching us will know we're finished loading data.
    transformer.on('end', this.trigger.bind(this, 'sync', this));
  }
});

var schema = new SampledSchema({
  ns: 'local.startup_log'
});
schema.on('sync', function() {
  debug('schema analyzed! It has %d fields', schema.fields.length);
  schema.fields.map(function(field, i) {
    debug('%d. %s', i, field._id);
  });
  client.close();
});
schema.fetch();
```

Because of the way scout and ampersand are built, we can try this out
right in the terminal instead of mucking about in the browser.  Save the above
under `~/scout/scout-ui/src/models/streams-01.js` and run the following in a
terminal window: `DEBUG=scout-* node src/models/streams-01.js`. You should see
something like the following https://gist.github.com/imlucas/83da48b4b05745fcfef2

Let's add some debugging to get a better look under the hood.

```javascript
var client = require('../../../scout-client')();
var Schema = require('mongodb-schema').Schema;
var debug = require('debug')('scout-streams-example');
var es = require('event-stream');

var SampledSchema = Schema.extend({
  fetch: function() {
    var docs = client.sample(this.ns, {
      size: 5,
      query: {},
      fields: null
    });
    var transformer = this.stream();

    docs.pipe(es.map(function(doc, done) {
      debug('got sampled document with _id `%j`', doc._id);
      done(null, doc);
    }))
      .pipe(transformer)
      .pipe(es.map(function(field, done) {
        debug('created or updated field `%s`', field._id);
        done(null, field);
      }));

    transformer.on('end', this.trigger.bind(this, 'sync', this));
  }
});

var schema = new SampledSchema({
  ns: 'local.startup_log'
});
schema.on('sync', function() {
  debug('schema analyzed! It has %d fields', schema.fields.length);
  client.close();
});
schema.fetch();
```

Save the above under `~/scout/scout-ui/src/models/streams-02.js` and run the
following in a terminal window: `DEBUG=scout-* node src/models/streams-02.js`.
You should see something like the following https://gist.github.com/imlucas/8baf67b46035bc1ae6d9

Let's make some UI!  Now that we know how to weild streams,  let's add a
new panel to the collection view that shows a list of sampled documents
with nice syntax highlighting.

To do the highlighting, we'll use the [html-stringify](http://npm.im/html-stringify)
module: `cd ~/scout/scout-ui; npm install --save html-stringify;`

Modify our schema model above to look like the below and save it as
`scout/scout-ui/src/models/sampled-schema.js`:

```javascript
// scout/scout-ui/src/models/sampled-schema.js
var brain = require('../../../scout-brain');
var client = require('../../../scout-client')();
var Schema = require('mongodb-schema').Schema;
var es = require('event-stream');

var SampledSchema = Schema.extend({
  collections: {
    documents: brain.models.DocumentCollection
  },
  fetch: function() {
    var docs = client.sample(this.ns, {
      size: 5,
      query: {},
      fields: null
    });
    var transformer = this.stream();
    var schema = this;

    docs.pipe(es.map(function(doc, done) {
      schema.documents.add(doc);
      done(null, doc);
    }))
      .pipe(transformer);
    transformer.on('end', this.trigger.bind(this, 'sync', this));
  }
});

module.exports = SampledSchema;
```

Next, lets write some views that use our new model and do the wiring
into the main `CollectionView`.

```javascript
// scout/scout-ui/src/home/index.js
// add as a subview to CollectionView
var htmlStringify = require('html-stringify');

var DocumentListItemView = AmpersandView.extend({
  derived: {
    document_html: {
      deps: ['model'],
      fn: function() {
        return htmlStringify(this.model.serialize());
      }
    }
  },
  bindings: {
    document_html: {
      hook: 'document_html',
      type: 'innerHTML'
    }
  },
  template: '<div class="list-group-item" data-hook="document_html"></div>'
});

var DocumentListView = AmpersandView.extend({
  template: '<div class="list-group" data-hook="documents"></div>',
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, DocumentListItemView, this.queryByHook('documents'));
  }
});

var CollectionView = AmpersandView.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    }
  },
  children: {
    model: models.Collection,
    schema: require('../models/sampled-schema')
  },
  initialize: function() {
    app.statusbar.watch(this, this.schema);

    this.schema.ns = this.model._id;
    this.schema.fetch();
  },
  template: require('./collection.jade'),
  subviews: {
    documents: {
      waitFor: 'schema.documents',
      hook: 'documents-container',
      prepareView: function(el) {
        return new DocumentListView({
            el: el,
            parent: this,
            collection: this.schema.documents
          });
      }
    },
    fields: {
      waitFor: 'schema.fields',
      hook: 'fields-container',
      prepareView: function(el) {
        return new FieldListView({
            el: el,
            parent: this,
            collection: this.schema.fields
          });
      }
    }
  }
});
```

Finally, modify the template `scout/scout-ui/src/home/index.jade`
to position our new subview.

```jade
// scout/scout-ui/src/home/index.jade
.panel-group
  .contextbar(style='width: 400px;position: absolute; right: 0;')
    .panel.panel-default
      .panel-heading
        .panel-title Sampled documents
      div(data-hook='documents-container')

  .panel.panel-default(style='margin-right: 420px;')
    .panel-heading
      .panel-title
        i.fa.fa-fw.fa-bars
        span(data-hook='name')
    div(data-hook='fields-container')
  .clearfix
```

Start up scout with `cd ~/scout && npm start` and you should see your
new panel that looks something like the below:

![](https://cldup.com/NSetVgVwVM.png)
