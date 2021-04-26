// before
db.coll.deleteMany({});
// command
db.coll.updateOne({a: 1}, {$set: {b: 1}}, {upsert: true});
// command
db.coll.find();
// clear
db.coll.drop();
