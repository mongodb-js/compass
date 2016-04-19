var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://localhost:27017/mongodb', function(err, db) {
  // Do normal ascending sort
  db.collection('fanclub').find({age: {$gte: 33, $lte: 40}})
    .project({age: 1, _id: 0})
    .sort({email: -1})
    .skip(20)
    .limit(9)
    .hint({age: 1})
    .explain(function(err2, explain) {
      console.log(JSON.stringify(explain, null, ' '));
      db.close();
    });
});
