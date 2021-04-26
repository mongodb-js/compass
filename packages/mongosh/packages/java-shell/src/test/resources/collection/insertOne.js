// before
db.coll.deleteMany({});
// command
const res = db.coll.insertOne({
    a: 1,
    objectId: new ObjectId('5ebaf064121756574a9767cf'),
    maxKey: new MaxKey(),
    minKey: new MinKey(),
    binData: new BinData(16, 'MTIzNA=='),
    date: new Date("2012-12-19"),
    isoDate: new ISODate("2012-12-19"),
    numberInt: NumberInt("24"),
    timestamp: new Timestamp(0, 100),
    "undefined": undefined,
    "null": null,
    uuid: new UUID('01234567-89ab-cdef-0123-456789abcdef')
});
// command
res
// command
res.acknowledged
// command
db.coll.find();
// clear
db.coll.drop();
