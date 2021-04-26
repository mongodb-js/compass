// before
db.coll.deleteMany({});
db.coll.insertOne({a: 1});
db.coll.insertOne({a: 2});
db.coll.insertOne({a: 3});
db.coll.insertOne({a: 4});
// command
db.coll.count({}, {unknown: 1});
// clear
db.coll.drop();
