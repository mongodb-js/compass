// before
db.coll.deleteMany({});
db.coll.insertOne({});
// command
db.coll.find().maxTimeMS(100);
// clear
db.coll.drop();