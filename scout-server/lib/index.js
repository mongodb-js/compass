var express = require('express');
var app = module.exports = express();
var redirect = require('./middleware/redirect');
var ejson = require('./middleware/ejson-body-parser');
var token_required = require('./middleware/token-required');
var collection_required = require('./middleware/collection-required');
var database_required = require('./middleware/database-required');
var health_check = require('./middleware/health-check');

var urldecode = require('body-parser').urlencoded({
  extended: false
});

app.server = require('http').createServer(app);
app.config = require('mongoscope-config');

if (process.env.NODE_ENV = 'development') {
  app.use(require('connect-livereload')({
    port: 35729,
    include: ['./']
  }));
  var livereload = require('tiny-lr')();
  var watch = require('watch');

  livereload.listen(35729);

  watch.watchTree(__dirname + '/../', {
    filter: function(filename) {
      return !(/node_modules/.test(filename));
    },
    ignoreDotFiles: true
  }, function(files) {
      livereload.changed({
        body: {
          files: files
        }
      });
    });
}


app.use(require('./middleware/watch-event-loop-blocking'));
app.use(require('./middleware/cors'));
app.use(require('./middleware/typed-params'));
app.use(require('./middleware/send-extended-json'));
app.use(require('./middleware/metrics'));

app.get('/api', redirect('/api/v1'));
app.get('/api/v1', function(req, res) {
  res.send({
    message: 'Welcome to Scout'
  });
});
app.get('/health-check', health_check());

/**
 * ## Route Param Triggers
 *
 * @see http://expressjs.com/api.html#app.param
 */
app.param('ns', require('./params/ns'));
app.param('create_ns', require('./params/create-ns'));
app.param('database_name', require('./params/database-name'));
app.param('instance_id', require('./params/instance-id'));
app.param('deployment_id', require('./params/deployment-id'));

/**
 * ## token
 */
var token = require('./routes/token');
app.post('/api/v1/token', ejson, token.post);
app.delete('/api/v1/token', token_required, token.destroy);

/**
 * ## deployment
 */
var deployment = require('./routes/deployment');
app.get('/api/v1/deployments', token_required, deployment.list);
app.get('/api/v1/deployments/:deployment_id', token_required, deployment.get);

/**
 * ## instance
 */
var instance = require('./routes/instance');
app.get('/api/v1/:instance_id', token_required, instance.get);

/**
 * ## database
 */
var database = require('./routes/database');
app.post('/api/v1/:instance_id/databases', token_required, database.post);
app.get('/api/v1/:instance_id/databases/:database_name', token_required, database_required, database.get);
app.delete('/api/v1/:instance_id/databases/:database_name', token_required, database_required, database.destroy);

/**
 * ## collection
 */
var collection = require('./routes/collection');
app.post('/api/v1/:instance_id/collections/:create_ns', token_required, collection.post);
app.get('/api/v1/:instance_id/collections/:ns', token_required, collection_required, collection.get);
app.put('/api/v1/:instance_id/collections/:ns', token_required, collection_required, ejson, collection.put);
app.delete('/api/v1/:instance_id/collections/:ns', token_required, collection_required, collection.destroy);

app.get('/api/v1/:instance_id/collections/:ns/count', token_required, collection_required, urldecode, collection.count);
app.get('/api/v1/:instance_id/collections/:ns/find', token_required, collection_required, urldecode, collection.find);
app.get('/api/v1/:instance_id/collections/:ns/sample', token_required, collection_required, urldecode, collection.sample);
app.get('/api/v1/:instance_id/collections/:ns/aggregate', token_required, collection_required, urldecode, collection.aggregate);
app.get('/api/v1/:instance_id/collections/:ns/distinct/:key', token_required, collection_required, collection.distinct);
app.get('/api/v1/:instance_id/collections/:ns/plans', token_required, collection_required, collection.plans);
app.post('/api/v1/:instance_id/collections/:ns/bulk', token_required, collection_required, collection.bulk);

/**
 * ## document
 */
var document = require('./routes/document');
app.post('/api/v1/:instance_id/documents/:ns', token_required, collection_required, ejson, document.create);
app.get('/api/v1/:instance_id/documents/:ns/:_id', token_required, collection_required, document.get);
app.delete('/api/v1/:instance_id/documents/:ns/:_id', token_required, collection_required, document.destroy);
app.put('/api/v1/:instance_id/documents/:ns/:_id', token_required, collection_required, ejson, document.update);


/**
 * ## index
 */
var _index = require('./routes/_index');
app.get('/api/v1/:instance_id/indexes/:ns', token_required, collection_required, _index.list);
app.post('/api/v1/:instance_id/indexes/:ns', token_required, collection_required, ejson, _index.create);
app.get('/api/v1/:instance_id/indexes/:ns/:index_name', token_required, collection_required, _index.get);
app.put('/api/v1/:instance_id/indexes/:ns/:index_name', token_required, collection_required, ejson, _index.update);
app.delete('/api/v1/:instance_id/indexes/:ns/:index_name', token_required, collection_required, _index.destroy);


/**
 * ## Error Handler
 */
app.use(require('./middleware/mongodb-boom'));


/**
 * ## Serve UI
 */
app.use(express.static(__dirname + '/../res'));

module.exports.listen = app.server.listen.bind(app.server);

/**
 * ## Setup socket.io
 */
require('./io');
