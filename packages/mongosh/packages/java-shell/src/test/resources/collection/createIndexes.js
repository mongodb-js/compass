// before
db.coll.deleteMany({});
db.coll.insertMany([{category: "cat1", v: 1}, {category: "cat2", title: "t3", v: 2}, {category: "cat2", title: "t4", v: 3}]);
// command
db.coll.createIndexes([{"category": 1}, {"title": 1}], {collation: {locale: "fr", strength: 2}});
// command getArrayItem=1 extractProperty=name
db.coll.getIndexes();
// command getArrayItem=2 extractProperty=name
db.coll.getIndexes();
// clear
db.coll.drop();
