// before
db.coll.deleteMany({});
db.coll.insertOne({a: 1});
db.coll.insertOne({a: 2});
db.coll.insertOne({a: 3});
// command
db.coll.find().limit(2);
// clear
db.coll.drop();