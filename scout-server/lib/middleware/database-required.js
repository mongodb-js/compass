module.exports = function(req, res, next){
  req.db = req.mongo.db(req.params.database_name);
  next();
};
