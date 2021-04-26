// before
db.coll.deleteMany({});
db.coll.insertOne({category: "cat1", v: 1});
db.coll.insertOne({category: "cat2", v: 2});
db.coll.insertOne({category: "cat2", v: 3});
db.coll.createIndex({category: 1}, {collation: {locale: "fr"}});
db.coll.createIndex({v: 1});
// command
db.coll.dropIndexes(['category_1', 'v_1']);
// command
db.coll.getIndexes();
// clear
db.coll.drop();
