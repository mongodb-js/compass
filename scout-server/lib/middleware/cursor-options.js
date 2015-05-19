module.exports = function(req, res, next) {
  req.params.cursor_options = {
    query: req.json('query', '{}'),
    skip: Math.max(0, req.int('skip', 0)),
    limit: req.int('limit', 0),
    sort: req.json('sort', 'null'),
    explain: req.boolean('explain', false),
    fields: req.json('fields', 'null')
  };
  next();
};
