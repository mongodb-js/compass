// before
db.coll.deleteMany({});
db.coll.insertOne({a: 1, text: 'to delete'});
db.coll.insertOne({a: 1});
// command
db.coll.findOneAndDelete({a: 1});
// command
db.coll.find();
// clear
db.coll.drop();
