// before
db.coll.deleteMany({});
db.coll.insertMany([{v: "a"}, {v: "a"}]);
// command
db.coll.findOne({"v": "a"});
// clear
db.coll.drop();
