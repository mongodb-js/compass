// before
db.coll.deleteMany({});
db.coll.insertOne({v: "before update"});
db.coll.insertOne({v: "to delete"});
db.coll.insertOne({v: "to delete"});
db.coll.insertOne({v: "before update many"});
db.coll.insertOne({v: "before update many"});
// command
db.coll.bulkWrite([
    {insertOne: {document: {a: 1}}},
    {insertOne: {document: {a: 1}}},
    {updateOne: {filter: {v: "before update"}, update: {$set: {v: "after update"}}, upsert: false}},
    {deleteMany: {filter: {v: "to delete"}}},
    {updateMany: {filter: {v: "before update many"}, update: {$set: {v: "after update many"}}}},
    {replaceOne: {filter: {v: "before replace"}, replacement: {v2: "after replace"}, upsert: true}},
]);
// command
db.coll.find();
// clear
db.coll.drop();
