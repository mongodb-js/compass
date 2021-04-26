// before
db.coll.deleteMany({});
db.coll.insertOne({a: 1});
db.coll.insertOne({a: 1});
db.coll.insertOne({a: 1});
// command
db.coll.updateMany({a: 1}, {$set: {b: 1}});
// command
db.coll.find();
// clear
db.coll.drop();
