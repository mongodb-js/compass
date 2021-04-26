// before
db.coll.deleteMany({});
db.coll.insertOne({"_id": 1, name: "Vasya"});
db.coll.insertOne({"_id": 2, name: "Petya"});
db.coll.insertOne({"_id": 3, name: "Lyusya"});
const result = [];
// command
db.coll.find().forEach(d => result.push(d));
// command
result
// clear
db.coll.drop();