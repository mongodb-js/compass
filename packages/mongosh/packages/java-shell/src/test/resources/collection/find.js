// before
db.coll.deleteMany({});
db.coll.insertOne({key: "value", array: [1, 2, 3, {another_object: "  .$# "}]});
// command checkResultClass
db.coll.find();
// clear
db.coll.drop();
