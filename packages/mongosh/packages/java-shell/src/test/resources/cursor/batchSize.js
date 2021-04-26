// before
db.coll.deleteMany({});
db.coll.insertOne({a: "a"});
db.coll.insertOne({a: "A"});
db.coll.insertOne({a: "á"});
// command
db.coll.find({a: "a"}).batchSize(10);
// clear
db.coll.drop();
