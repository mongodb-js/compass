// before
db.coll.deleteMany({});
db.coll.insertMany([{v: 1}, {v: 2}]);
// command
db.coll.find({v: 1}).count();
// command
db.coll.find().limit(1).count();
// command
db.coll.find({}, {}, {"comment": "hello"}).count();
// clear
db.coll.drop();
