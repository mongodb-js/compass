// before
db.coll.deleteMany({});
db.coll.insertOne({"_id": 1, name: "Vasya"});
db.coll.insertOne({"_id": 2, name: "Petya"});
db.coll.insertOne({"_id": 3, name: "Lyusya"});
// command extractProperty=queryPlanner extractProperty=namespace
db.coll.explain().find();
// command extractProperty=queryPlanner extractProperty=namespace
db.coll.explain("executionStats").find();
// command extractProperty=queryPlanner extractProperty=namespace
db.coll.find().explain();
// command containsProperty=executionStats
db.coll.find().explain("executionStats");
// command containsProperty=executionStats
db.coll.find().explain("queryPlanner");
// command extractProperty=executionStats extractProperty=executionStages extractProperty=limitAmount
db.coll.find().limit(42).explain("executionStats");
// command extractProperty=executionStats extractProperty=executionStages extractProperty=filter
db.coll.find({name: "Vasya"}).explain("executionStats");
// command extractProperty=executionStats extractProperty=executionStages extractProperty=transformBy
db.coll.find({}, {_id: -1}).explain("executionStats");
// clear
db.coll.drop();