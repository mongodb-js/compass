// before
db.coll.drop();
db.coll.insertOne({a: 1});
db.coll.insertOne({a: 2});
db.coll.insertOne({a: 3});
// command
db.coll.find().forEach(d => print(d));
1
// command
db.coll.find().forEach(d => print("my document", d));
// command
console.log("Hello, world!")
// clear
db.coll.drop();
