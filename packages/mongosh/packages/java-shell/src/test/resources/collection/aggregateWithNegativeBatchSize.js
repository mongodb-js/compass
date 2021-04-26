// before
db.coll.deleteMany({});
db.coll.insertOne({status: "A", amount: 1, group: "11"});
db.coll.insertOne({status: "A", amount: 2, group: "11"});
db.coll.insertOne({status: "A", amount: 3, group: "11"});
db.coll.insertOne({status: "A", amount: 1, group: "2"});
db.coll.insertOne({status: "A", amount: 1, group: "2"});
db.coll.insertOne({status: "B", amount: 1, group: "2"});
// command
db.coll.aggregate([
    {$match: {status: "A"}},
    {$group: {_id: "$group", total: {$sum: "$amount"}}},
    {$sort: {_id: 1}}
], {cursor: {batchSize: -1}});
// clear
db.coll.drop();
