// appease the jshint gods
var mongoscope = window.mongoscopeClient, $ = window.$, infer = window.mongodbInfer;

mongoscope.configure({endpoint: 'http://scope.mongodb.land'});

mongoscope.sample('canada.service_requests', {size: 20}, function(err, res){
  $('.raw').text(JSON.stringify(res, null, 2));

  var schemas = res.map(infer);
  $('.schema-raw').text(JSON.stringify(schemas, null, 2));
});
