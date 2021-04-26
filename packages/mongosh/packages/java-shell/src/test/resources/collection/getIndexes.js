// before
db.coll.deleteMany({});
db.coll.insertOne({a: 1});
// command
db.coll.getIndexes();
// clear
db.coll.drop();
