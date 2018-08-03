const config = require('../config/error.json');
const errors = {};

Object.keys(config).forEach((error) => {
  const name = `BsonTranspilers${error}Error`;
  const code = `E_BSONTRANSPILERS_${error.toUpperCase()}`;
  const message = config[error].message;

  errors[name] = class extends Error {
    constructor(msg, opts) {
      const m = msg || message;
      super();
      this.name = name;
      this.code = code;
      this.message = m;
      if (opts && 'stack' in opts) {
        this.stack = opts.stack;
      } else {
        Error.captureStackTrace(this, errors[name]);
      }
      Object.assign(this, opts || {});
    }
  };
});

module.exports = errors;
