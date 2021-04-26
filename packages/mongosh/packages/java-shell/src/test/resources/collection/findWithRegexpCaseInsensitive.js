// before
db.coll.deleteMany({});
db.coll.insertOne({a: 'cat1'});
db.coll.insertOne({a: 'cat2'});
db.coll.insertOne({a: 'cat3'});
// command
db.coll.find({a: /Cat/i});
// clear
db.coll.drop();
