// before
db.coll.deleteMany({});
db.coll.insertOne({name: "Vasya"});
// command checkResultClass
db.coll.find().map(d => d.name).batchSize(1);
// clear
db.coll.drop();
