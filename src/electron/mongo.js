module.exports.start = function(done) {
  done();
};

module.exports.stop = function(done) {
  process.nextTick(done);
};
