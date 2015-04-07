var joi = require('joi');

var types = {
  id: joi.string().min(4)
    .regex(/^([\w\-\.]+)\:?(\d+)?$/),
  database_name: joi.string().min(2).max(128)
    .regex(/^[^\\\\\/\'".*<>:|? ]*$/),
  collection_name: joi.string().min(2).max(128)
    .regex(/(local\.oplog\.(\$main|rs)|(^[^\0\$]*$))/)
};

module.exports = function(value, type, fn){
  joi.validate(value, types[type], fn);
};

module.exports.middleware = function validate(key, type){
  if(!type) type = key;
  return function(req, res, next){
    joi.validate(req.param(key), types[type], function (err, value){
      if(err) return next(err);

      req.params[key] = value;
      next();
    });
  };
};
module.exports.types = types;
