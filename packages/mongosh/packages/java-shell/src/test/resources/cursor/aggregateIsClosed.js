// before
db.coll.deleteMany({});
db.coll.insertOne({"_id": 1, name: "Vasya"});
db.coll.insertOne({"_id": 2, name: "Petya"});
db.coll.insertOne({"_id": 3, name: "Lyusya"});
// command
db.coll.aggregate([{$sort: {_id: -1}}]).isClosed();
// clear
db.coll.drop();