// before
use test_show_collections;
// command
db.coll.insertOne({});
// command
show collections;
// clear
db.coll.drop();
