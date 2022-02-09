"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const formatters_1 = require("../../packages/compass-import-export/src/utils/formatters");
const fs_1 = require("fs");
const stream_1 = __importDefault(require("stream"));
const COLUMNS = ['_id', 'tripduration', 'starttime', 'endtime', 'bikeid'];
let i = 0;
const streamHandler = new stream_1.default.Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(chunk, encoding, callback) {
        this.push(`${++i}\n`);
        callback();
    },
});
async function main() {
    const connectionString = `${process.env.CONNECTION_STRING}`;
    const conn = new mongodb_1.MongoClient(connectionString);
    await conn.connect();
    const formatter = (0, formatters_1.createCSVFormatter)({
        columns: COLUMNS
    });
    console.log(connectionString);
    const collection = await conn.db('citibike').collection('trips');
    const docsStream = await collection.find().limit(25 * 1000).stream();
    let i = 0;
    const streams = [formatter, (0, fs_1.createWriteStream)('/tmp/test.dump')];
    docsStream
        .pipe(streamHandler)
        .pipe((0, fs_1.createWriteStream)('/tmp/test.dump'))
        .on('finish', () => {
        console.log('finished');
        conn.close();
    });
}
main();
//# sourceMappingURL=test-export.js.map