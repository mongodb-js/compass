// before
db.coll.deleteMany({});
db.coll.insertOne({a: 1});
db.coll.insertOne({a: 2});
db.coll.insertOne({a: 3});
// command
db.coll.findOneAndUpdate({a: 1}, {$inc: {a: 5}}, {sort: {a: -1}});
// command
db.coll.find();
// clear
db.coll.drop();
