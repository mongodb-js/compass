const parser = require('./parser');

module.exports = {
  parse: parser.parse,
  accepts: function(str) {
    try {
      parser.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
};
