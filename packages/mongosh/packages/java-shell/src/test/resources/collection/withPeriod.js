// before
db.coll.with.dot.remove({});
db.coll.with.dot.insertOne({a: 1});
db.coll.with.dot.insertOne({a: 2});
db.coll.with.dot.insertOne({a: 3});
// command
db.coll.with.dot.find();
// clear
db.coll.with.dot.drop();
