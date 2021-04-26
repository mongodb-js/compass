// before
db.coll.deleteMany({});
db.coll.insertOne({a: 1});
// command
db.coll.drop();
// command
db.coll.find();
