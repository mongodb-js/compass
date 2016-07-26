module.exports = {
  port: {
    set: function(newVal) {
      var port = parseInt(newVal, 10);
      if (newVal === '' || isNaN(port)) {
        return {
          type: 'undefined',
          val: undefined
        };
      }

      if (port < 0) {
        throw new TypeError('port number must be positive.');
      }

      if (port >= 65536) {
        throw new TypeError('port number must be below 65536');
      }

      return {
        type: 'port',
        val: newVal
      };
    }
  }
};
