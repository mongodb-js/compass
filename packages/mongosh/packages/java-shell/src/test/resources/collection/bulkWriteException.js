// before
db.coll.deleteMany({});
// command
db.coll.bulkWrite([{unknown: {document: {a: 1}}}]);
// clear
db.coll.drop();
