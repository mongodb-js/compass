// before
db.coll.deleteMany({});
db.coll.insertOne({a: 1});
// command
db.coll.findOneAndReplace({a: 1}, {a: 2});
// command
db.coll.find();
// clear
db.coll.drop();
