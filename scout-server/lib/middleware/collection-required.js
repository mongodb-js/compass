var boom = require('boom');

module.exports = function(req, res, next){
  req.db = req.mongo.db(req.params.database_name);

  req.db.collection(req.params.collection_name, {
    strict: true
  }, function(err, col) {
    if (err){
      if(/does not exist/.test(err.message)){
        return next(boom.notFound(err.message));
      }

      return next(err);
    }
    req.col = col;
    req.col.name = req.params.collection_name;
    next();
  });
};
