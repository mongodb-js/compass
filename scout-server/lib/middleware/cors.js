module.exports = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, If-None-Match');
  var want = (req.headers['access-control-request-headers'] || '').split(', ');
  if (req.method === 'OPTIONS' && want.length > 0) return res.status(200).send('');
  next();
};
