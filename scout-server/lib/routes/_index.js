var boom = require('boom');
var debug = require('debug')('scout-server:routes:_index');

module.exports = {
  list: function(req, res, next) {
    req.db.collection('system.indexes', function(err, col) {
      col.find({
        ns: req.ns.toString()
      }).toArray(function(err, data) {
        if (err) return next(err);
        res.status(200).send(data);
      });
    });
  },
  get: function(req, res, next) {
    var query = {
      ns: req.ns.toString(),
      name: req.param('index_name')
    };

    req.db.collection('system.indexes').findOne(query, function(err, data) {
      if (err) return next(err);
      if (!data) {
        return next(boom.notFound('Index does not exist'));
      }
      res.status(200).send(data);
    });
  },
  destroy: function(req, res, next) {
    if (req.param('index_name') === '*') {
      return next(boom.badRequest('Drop indexes individually.'));
    }
    var name = req.param('index_name');
    req.db.dropIndex(req.ns.collection, name, function(err) {
      if (err) {
        if (err.message.indexOf('index not found') > -1) {
          return next(boom.notFound('Index does not exist'));
        }
        return next(err);
      }
      debug('dropped index', name);
      res.status(204).send();
    });
  },
  create: function(req, res, next) {
    var field = req.body.field,
      options = req.body.options || {};

    if (!field) {
      return next(boom.badRequest('No field specified.'));
    }

    if (typeof options !== 'object') {
      return next(boom.badRequest('options must be an object'));
    }

    req.db.createIndex(req.ns.collection, field, options, function(err, name) {
      if (err) {
        if (err.message.indexOf('bad index key pattern') > -1) {
          return next(boom.badRequest('Invalid index key pattern `' + JSON.stringify(field) + '`.  Should be {key: [1|-1]}'));
        }
        return next(err);
      }

      req.db.collection('system.indexes', function(err, col) {
        col.findOne({
          ns: req.ns.toString(),
          name: name
        }, function(err, doc) {
          if (err) return next(err);
          res.status(201).send(doc);
        });
      });
    });
  },
  update: function(req, res, next) {
    var field = req.body.field,
      options = req.body.options || {};

    if (!field) {
      return next(boom.badRequest('No field specified.'));
    }

    if (typeof options !== 'object') {
      return next(boom.badRequest('options must be an object'));
    }

    req.db.ensureIndex(req.ns.collection, field, options, function(err, data) {
      if (err) {
        if (err.message.indexOf('bad index key pattern') > -1) {
          return next(boom.badRequest('field param is an invalid index key pattern.  Should be {key: [1|-1]}'));
        }
        return next(err);
      }
      res.status(200).send({
        name: data
      });
    });
  }
};
