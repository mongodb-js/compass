// before
db.coll.deleteMany({});
db.coll.insertOne({a: 1});
db.coll.insertOne({a: 1});
db.coll.insertOne({a: 1});
// command
db.coll.updateOne({a: 1}, [{$unset: ["a"]}, {$set: {b: 1}}]);
// command
db.coll.find();
// clear
db.coll.drop();
