module.exports = function(dest) {
  return function(req, res) {
    return res.redirect(dest);
  };
};
