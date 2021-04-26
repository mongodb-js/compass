// before
db.coll.deleteMany({});
db.coll.insertOne({a: 1});
// command
db.coll.isCapped()
// clear
db.coll.drop();
