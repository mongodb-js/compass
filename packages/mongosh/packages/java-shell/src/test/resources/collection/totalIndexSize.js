// before
db.coll.deleteMany({});
db.coll.insertOne({key: "value"});
// command dontCheckValue
db.coll.totalIndexSize();
// clear
db.coll.drop();
// clear
db.coll.drop();
