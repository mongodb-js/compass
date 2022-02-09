const mongodb = require("mongodb").MongoClient;
const fastcsv = require("fast-csv");
const fs = require("fs");
const ws = fs.createWriteStream("bezkoder_mongodb_fastcsv.csv");
// let url = "mongodb://username:password@localhost:27017/";
let url = process.env.CONNECTION_STRING;
mongodb.connect(
  url,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err, client) => {
    if (err) throw err;
    client
      .db("citibike")
      .collection("trips")
      .find({})
      .limit(25000)
      .toArray((err, data) => {
        if (err) throw err;
        // console.log(data);
        fastcsv
          .write(data, { headers: true })
          .on("finish", function() {
            console.log("Write to bezkoder_mongodb_fastcsv.csv successfully!");
          })
          .pipe(ws);
        client.close();
      });
  }
);