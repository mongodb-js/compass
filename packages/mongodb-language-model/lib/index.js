var parser = require('./parser');

module.exports = {
  parse: parser.parse,
  accepts: function accepts(str) {
    try {
      parser.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
};