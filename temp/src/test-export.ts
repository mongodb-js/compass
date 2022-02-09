import { MongoClient } from 'mongodb';
import { createCSVFormatter } from '../../packages/compass-import-export/src/utils/formatters';
import { serialize as flatten } from '../../packages/compass-import-export/src/utils//bson-csv';
import * as csv from 'fast-csv';
import { createWriteStream } from 'fs';
import stream from 'stream';
import { ReadableStream } from 'stream/web';

const COLUMNS = ['_id', 'tripduration', 'starttime', 'endtime', 'bikeid']
let i = 0;
const streamHandler = new stream.Transform({
  readableObjectMode: true,
  writableObjectMode: true, // Enables us to use object in chunk
  transform(chunk, encoding, callback) {
    this.push(`${++i}\n`);
    callback();
  },
});

async function main() {
  const connectionString = `${process.env.CONNECTION_STRING}`;
  const conn = new MongoClient(connectionString);
  await conn.connect();
  const formatter = createCSVFormatter({
    columns: COLUMNS
  });
  console.log(connectionString);
  const collection = await conn.db('citibike').collection('trips');
  const docsStream = await collection.find().limit(25 * 1000).stream();
  let i = 0;
  const streams = [formatter, createWriteStream('/tmp/test.dump')]
  // stream.pipeline(docsStream, ...streams, (err) => {
  //   console.log(err);
  //   console.log('finished');
  //   conn.close();
  // })
  docsStream
    // .pipe(formatter)
    .pipe(streamHandler)
    .pipe(createWriteStream('/tmp/test.dump'))
    // .pipe(process.stdout)
    .on('finish', () => {
      console.log('finished')
      conn.close();
    })
  // docsStream.on('end', async function() {
    
  // })
}

main();