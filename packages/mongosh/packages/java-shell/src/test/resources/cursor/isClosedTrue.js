// before
const cursor = db.coll.find();
cursor.close()
// command
cursor.isClosed();
// clear
db.coll.drop();