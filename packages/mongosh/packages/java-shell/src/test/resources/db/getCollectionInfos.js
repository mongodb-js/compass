// before
db.testCollection1.deleteMany({});
db.testCollection1.insertOne({a: 1});
// command
db.getCollectionInfos({name: {$regex: "testCollection.*"}});
// clear
db.testCollection1.drop();
