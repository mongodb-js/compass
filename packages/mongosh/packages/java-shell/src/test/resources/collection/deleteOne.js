// before
db.coll.deleteMany({});
db.coll.insertOne({status: "A", amount: 1, group: "G1"});
db.coll.insertOne({status: "A", amount: 2, group: "G1"});
db.coll.insertOne({status: "A", amount: 3, group: "G1"});
db.coll.insertOne({status: "A", amount: 1, group: "G2"});
db.coll.insertOne({status: "A", amount: 1, group: "G2"});
db.coll.insertOne({status: "B", amount: 1, group: "G2"});
// command
db.coll.deleteOne({status: "A"});
// clear
db.coll.drop();
