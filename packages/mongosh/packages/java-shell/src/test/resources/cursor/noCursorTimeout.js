// before
db.coll.deleteMany({});
db.coll.insertOne({});
// command
db.coll.find().noCursorTimeout()
// clear
db.coll.drop();