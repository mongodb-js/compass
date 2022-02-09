"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCSVFormatter = exports.createJSONFormatter = void 0;
const csv = __importStar(require("fast-csv"));
const bson_1 = require("bson");
const bson_csv_1 = require("./bson-csv");
const stream_1 = require("stream");
const os_1 = require("os");
const createJSONFormatter = function ({ brackets = true } = {}) {
    return new stream_1.Transform({
        readableObjectMode: false,
        writableObjectMode: true,
        transform: function (doc, encoding, callback) {
            if (this._counter >= 1) {
                if (brackets) {
                    this.push(',');
                }
                else {
                    this.push(os_1.EOL);
                }
            }
            const s = bson_1.EJSON.stringify(doc, null, brackets ? 2 : null);
            if (this._counter === undefined) {
                this._counter = 0;
                if (brackets) {
                    this.push('[');
                }
            }
            callback(null, s);
            this._counter++;
        },
        final: function (done) {
            if (brackets) {
                this.push(']');
            }
            done();
        }
    });
};
exports.createJSONFormatter = createJSONFormatter;
const createCSVFormatter = function ({ columns }) {
    return csv.format({
        headers: columns,
        alwaysWriteHeaders: true,
        transform: row => {
            return (0, bson_csv_1.serialize)(row);
        }
    });
};
exports.createCSVFormatter = createCSVFormatter;
//# sourceMappingURL=formatters.js.map