// before
db.coll.deleteMany({});
db.coll.insertOne({a: "a"});
db.coll.insertOne({a: "A"});
db.coll.insertOne({a: "á"});
// command
db.coll.aggregate([{$match: {a: "a"}}], {collation: {"locale": "en_US", strength: 1}})
    .readPref('nearest');
// command
db.coll.aggregate([{$match: {a: "a"}}], {collation: {"locale": "en_US", strength: 1}})
    .readPref("secondary", [{"region": "South"}]);
// command
db.coll.aggregate([{$match: {a: "a"}}], {collation: {"locale": "en_US", strength: 1}})
    .readPref("secondary", [{"region": "South", "datacenter": "A"}, {}]);
// clear
db.coll.drop();
