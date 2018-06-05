const config = require('../config/error.json');
const errors = {};

Object.keys(config).forEach((error) => {
  const name = `BsonCompilers${error}Error`;
  const code = `E_BSONCOMPILERS_${error.toUpperCase()}`;
  const message = config[error].message;

  errors[name] = class extends Error {
    constructor(msg, opts) {
      const m = msg || message;
      super();
      this.name = name;
      this.code = code;
      this.message = m;
      Object.assign(this, opts || {});
      Error.captureStackTrace(this, errors[name]);
    }
  };
});

module.exports = errors;
