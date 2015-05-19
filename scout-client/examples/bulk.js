// Prints out the following when run on the command line:
// ```
// Generating 100 documents and inserting them into `test.oid_and_number`...
// progress: 20/100
// progress: 40/100
// progress: 60/100
// progress: 80/100
// progress: 100/100
// complete!
// 81ms
// ```
var datasets = require('mongodb-datasets'),
  scope = require('../')();

var size = 100;
var schema = {
  n: '{{chance.d10()}}'
};
var ns = 'test.oid_and_number';

console.log('Generating ' + size + ' documents and inserting them into `'+ns+'`...');

var start = Date.now(), docs = 0;
var backend = scope.collection(ns).createWriteStream()
  .on('end', function(){
    console.log('complete!');
    console.log((Date.now() - start) + 'ms');
    scope.close();
  })
  .on('flush', function(res){
    docs += res.inserted_count;
    console.log('progress: ' + docs + '/' + size);
  });

datasets(size, schema).pipe(backend);
