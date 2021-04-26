// before
db.coll.deleteMany({});
db.coll.insertOne({category: "cat1", v: 1});
db.coll.insertOne({category: "cat2", v: 2});
db.coll.insertOne({category: "cat2", v: 3});
// command
db.coll.createIndex({category: 1}, {collation: {locale: "fr"}});
// command getArrayItem=1 extractProperty=name
db.coll.getIndexes();
// command
db.coll.dropIndex({category: 1});
// command
db.coll.createIndex({category: 1}, {default_language: "de"});
// command getArrayItem=1 extractProperty=default_language
db.coll.getIndexes();
// command
db.coll.dropIndex({category: 1});
// command
db.coll.createIndex({category: 'text', v: 'text'}, {weights: {category: 10, v: 5}});
// command getArrayItem=1 extractProperty=weights
db.coll.getIndexes();
// clear
db.coll.drop();
