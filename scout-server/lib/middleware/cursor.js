module.exports = function(req, res, next) {
  if (!req.params.cursor_options) {
    return next(new TypeError('Must use the cursor middleware after the cursor_options middleware'));
  }
  var query = req.params.cursor_options.query;
  var db = req.mongo.db(req.params.database_name);
  var collection = db.collection(req.params.collection_name);
  req.cursor = collection.find(query, req.params.cursor_options);
  next();
};
