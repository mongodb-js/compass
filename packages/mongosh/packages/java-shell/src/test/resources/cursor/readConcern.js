// before
db.coll.drop();
db.coll.insertOne({a: 1});
// command
db.coll.find().readConcern('local');
// command
db.coll.find().readConcern('unknown');
// clear
db.coll.drop();