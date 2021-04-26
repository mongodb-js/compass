// before
db.coll.deleteMany({});
db.coll.insertOne({"_id": 1, name: "Vasya"});
db.coll.insertOne({"_id": 2, name: "Petya"});
db.coll.insertOne({"_id": 3, name: "Lyusya"});
// command extractProperty=ok
db.coll.explain().aggregate([{$sort: {_id: -1}}], {collation: {"locale": "en_US", strength: 1}});
// clear
db.coll.drop();