// before
db.coll.deleteMany({});
db.coll.insertOne({name: "value1", v: 1});
db.coll.insertOne({name: "value2", v: 2});
db.coll.insertOne({name: "value2", v: 3});
// command
db.coll.find().next();
// clear
db.coll.drop();