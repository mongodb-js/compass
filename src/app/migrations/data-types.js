module.exports = {
  port: {
    set: (val) => {
      const port = parseInt(val, 10);

      if (val === '' || isNaN(port)) {
        return { type: 'undefined', val: undefined };
      }

      if (port < 0) {
        throw new TypeError('port number must be positive.');
      }

      if (port >= 65536) {
        throw new TypeError('port number must be below 65536');
      }

      return { type: 'port', val };
    }
  }
};
