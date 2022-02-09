"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.valueToString = exports.serialize = exports.getTypeDescriptorForValue = exports.detectType = exports.getBSONTypeForValue = void 0;
const bson_1 = __importDefault(require("bson"));
const logger_1 = require("./logger");
const debug = (0, logger_1.createDebug)('bson-csv');
const BOOLEAN_TRUE = ['1', 'true', 'TRUE', true];
const BOOLEAN_FALSE = ['0', 'false', 'FALSE', 'null', '', 'NULL', false];
const casters = {
    String: {
        fromString: function (s) {
            return '' + s;
        }
    },
    Number: {
        fromString: function (s) {
            s = '' + s;
            if (s.includes('.')) {
                return parseFloat(s);
            }
            return parseInt(s, 10);
        }
    },
    Boolean: {
        fromString: function (s) {
            if (BOOLEAN_TRUE.includes(s)) {
                return true;
            }
            if (BOOLEAN_FALSE.includes(s)) {
                return false;
            }
            return Boolean(s);
        }
    },
    Date: {
        fromString: function (s) {
            if (s instanceof Date) {
                return s;
            }
            return new Date('' + s);
        }
    },
    ObjectID: {
        fromString: function (s) {
            const { isBSON } = getTypeDescriptorForValue(s);
            if (isBSON) {
                return s;
            }
            return new bson_1.default.ObjectID(s);
        }
    },
    Long: {
        fromString: function (s) {
            if (s instanceof bson_1.default.Long) {
                return s;
            }
            return bson_1.default.Long.fromString(s);
        }
    },
    RegExpr: {
        fromString: function (s) {
            if (s instanceof bson_1.default.BSONRegExp) {
                return s;
            }
            return new bson_1.default.BSONRegExp(s);
        }
    },
    Binary: {
        fromString: function (s) {
            if (s instanceof bson_1.default.Binary) {
                return s;
            }
            return new bson_1.default.Binary(s, bson_1.default.Binary.SUBTYPE_DEFAULT);
        }
    },
    UUID: {
        fromString: function (s) {
            if (s instanceof bson_1.default.Binary) {
                return s;
            }
            return new bson_1.default.Binary(s, bson_1.default.Binary.SUBTYPE_UUID);
        }
    },
    MD5: {
        fromString: function (s) {
            if (s instanceof bson_1.default.Binary) {
                return s;
            }
            return new bson_1.default.Binary(s, bson_1.default.Binary.SUBTYPE_MD5);
        }
    },
    Timestamp: {
        fromString: function (s) {
            if (s instanceof bson_1.default.Timestamp) {
                return s;
            }
            return bson_1.default.Timestamp.fromString(s);
        }
    },
    Double: {
        fromString: function (s) {
            return new bson_1.default.Double(s);
        }
    },
    Int32: {
        fromString: function (s) {
            return parseInt(s, 10);
        }
    },
    Decimal128: {
        fromString: function (s) {
            return bson_1.default.Decimal128.fromString(s);
        }
    }
};
casters.BSONRegExp = casters.RegExpr;
exports.default = casters;
const TYPE_FOR_TO_STRING = new Map([
    ['[object Array]', 'Array'],
    ['[object Object]', 'Object'],
    ['[object String]', 'String'],
    ['[object Date]', 'Date'],
    ['[object Number]', 'Number'],
    ['[object Function]', 'Function'],
    ['[object RegExp]', 'RegExp'],
    ['[object Boolean]', 'Boolean'],
    ['[object Null]', 'Null'],
    ['[object Undefined]', 'Undefined']
]);
function getBSONTypeForValue(value) {
    const type = value && value._bsontype;
    if (type === 'ObjectId') {
        return 'ObjectID';
    }
    if (type) {
        return type;
    }
    return undefined;
}
exports.getBSONTypeForValue = getBSONTypeForValue;
function detectType(value) {
    const bsonType = getBSONTypeForValue(value);
    if (bsonType) {
        return bsonType;
    }
    const o = Object.prototype.toString.call(value);
    const t = TYPE_FOR_TO_STRING.get(o);
    if (!t) {
        return getBSONTypeForValue(value);
    }
    return t;
}
exports.detectType = detectType;
function getTypeDescriptorForValue(value) {
    const t = detectType(value);
    const _bsontype = getBSONTypeForValue(value);
    return {
        type: _bsontype ? _bsontype : t,
        isBSON: !!_bsontype
    };
}
exports.getTypeDescriptorForValue = getTypeDescriptorForValue;
const serialize = function (doc) {
    const delimiter = '.';
    const output = {};
    const maxDepth = 1000;
    function step(object, prev, currentDepth = 1) {
        Object.keys(object).forEach(function (key) {
            const value = object[key];
            const { type, isBSON } = getTypeDescriptorForValue(value);
            const newKey = prev ? prev + delimiter + key : key;
            debug('serialize', { isBSON, type, value });
            if (isBSON) {
                output[newKey] = (0, exports.valueToString)(value);
                return;
            }
            if (type === 'Array') {
                output[newKey] = bson_1.default.EJSON.stringify(value, null, null);
                return;
            }
            if (type === 'Date') {
                output[newKey] = value.toISOString();
                return;
            }
            if (type === 'Boolean') {
                if (BOOLEAN_TRUE.includes(value)) {
                    output[newKey] = 'true';
                    return;
                }
                if (BOOLEAN_FALSE.includes(value)) {
                    output[newKey] = 'false';
                    return;
                }
            }
            if (type === 'Object' &&
                Object.keys(value).length &&
                currentDepth < maxDepth) {
                return step(value, newKey, currentDepth + 1);
            }
            output[newKey] = '' + value;
        });
    }
    step(doc);
    return output;
};
exports.serialize = serialize;
const valueToString = function (value) {
    const { type, isBSON } = getTypeDescriptorForValue(value);
    if (isBSON) {
        if (type === 'BSONRegExp') {
            return `/${value.pattern}/${value.options}`;
        }
        if (type === 'ObjectID') {
            return value.toString('hex');
        }
        if (type === 'Binary') {
            return value.toString('base64');
        }
        return value.toString();
    }
    if (type === 'Array') {
        return bson_1.default.EJSON.stringify(value, null, null);
    }
    if (type === 'Date') {
        return value.toISOString();
    }
    return '' + value;
};
exports.valueToString = valueToString;
//# sourceMappingURL=bson-csv.js.map