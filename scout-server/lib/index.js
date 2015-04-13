var express = require('express'),
  app = module.exports = express(),
  redirect = require('./middleware/redirect'),
  ejson = require('./middleware/ejson-body-parser'),
  token_required = require('./middleware/token-required'),
  collection_required = require('./middleware/collection-required'),
  database_required = require('./middleware/database-required'),
  health_check = require('./middleware/health-check');

app.server = require('http').createServer(app);
app.config = require('mongoscope-config');

app.use(require('./middleware/cors'));
app.use(require('./middleware/typed-params'));
app.use(require('./middleware/send-extended-json'));

// @todo re-enable request stats collection when stable.
// app.use(require('./middleware/metrics'));

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
 * ## instance
 */
var instance = require('./routes/instance');
app.get('/api/v1/:instance_id', token_required, instance.get);

/**
 * ## deployment
 */
var deployment = require('./routes/deployment');
app.get('/api/v1/deployments', token_required, deployment.list);
app.get('/api/v1/deployments/:deployment_id', token_required, deployment.get);

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
app.put('/api/v1/:instance_id/collections/:ns', token_required, collection_required, collection.put);
app.delete('/api/v1/:instance_id/collections/:ns', token_required, collection_required, collection.destroy);

app.get('/api/v1/:instance_id/collections/:ns/count', token_required, collection_required, collection.count);
app.get('/api/v1/:instance_id/collections/:ns/find', token_required, collection_required, collection.find);
app.get('/api/v1/:instance_id/collections/:ns/sample', token_required, collection_required, collection.sample);
app.get('/api/v1/:instance_id/collections/:ns/aggregate', token_required, collection_required, collection.aggregate);
app.get('/api/v1/:instance_id/collections/:ns/distinct/:key', token_required, collection_required, collection.distinct);
app.get('/api/v1/:instance_id/collections/:ns/plans', token_required, collection_required, collection.plans);
app.post('/api/v1/:instance_id/collections/:ns/bulk', token_required, collection_required, collection.bulk);

app.use(require('./middleware/mongodb-boom'));

app.use(express.static(__dirname + '/../res'));

module.exports.listen = app.server.listen.bind(app.server);

require('./io');
