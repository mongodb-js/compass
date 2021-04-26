// before
db.coll.deleteMany({});
// command
db.coll.insertOne({_id: "b", name: "b"});
db.coll.insertMany([{_id: "b", name: "b"}, {_id: "d", name: "d"}], {ordered: false});
// command
db.coll.find();
// clear
db.coll.drop();
