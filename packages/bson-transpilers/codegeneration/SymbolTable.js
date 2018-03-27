/* eslint key-spacing:0, no-multi-spaces:0 */
const { doubleQuoteStringify } = require('./helpers');

const SYMBOL_TYPE = { VAR: 0, CONSTRUCTOR: 1, FUNC: 2 };

/**
 * Symbols represent classes, variables, and functions.
 *
 * @param {String} id - identifier. TODO: for now, internals start with _
 * @param {Number} callable - if it's a function, constructor, or variable.
 * @param {Array} args - arguments if its callable. An array of tuples where
 * each tuple has each possible type for the argument at that index.
 * @param {Symbol} type - the type the symbol returns. Could be a Symbol or
 * 0 if it's a primitive type.
 * @param {Scope} attrs - the attributes of the returned type. TODO: do we want to strictly check all objs or just BSON/Built-in.
 * @param {Function} template - the string template for this type. This is the first
 * step in (slowly) extracting any language-specific code out of the visitor so that
 * we can use the same visitor for every export language. Eventually, each type that
 * needs translation will include a string template that we can swap out depending
 * on what language we're compiling to. The visitor will be mostly be controlling
 * the order of nodes visited and handling edge cases.
 *
 * @returns {Symbol}
 */
function Symbol(id, callable, args, type, attrs, template) {
  return {
    id: id,
    callable: callable,
    args: args,
    type: type,
    attr: attrs,
    template: template
  };
}

/**
 * Scope represents both namespaces and variable scope. Eventually the
 * data structure we're going to use for scopes will have the ability to
 * push/pop scopes, lookup variables, add variables to scope, and handle
 * collisions. For now it's just an object.
 *
 * @param {Object} attrs - The Symbols within the scope.
 * @return {Scope}
 */
function Scope(attrs) {
  return attrs;
}

/**
 * Symbols representing the basic language types. Eventually the attrs will be
 * expanded to include built-in functions for each type.
 */
const Types = new Scope({
  _string:    new Symbol('_string',     SYMBOL_TYPE.VAR, null, 0, new Scope({}), (literal) => { return `${doubleQuoteStringify(literal)}`; }),
  _regex:     new Symbol('_regex',      SYMBOL_TYPE.VAR, null, 0, new Scope({})),
  _bool:      new Symbol('_bool',       SYMBOL_TYPE.VAR, null, 0, new Scope({})),
  _integer:   new Symbol('_integer',    SYMBOL_TYPE.VAR, null, 0, new Scope({})),
  _decimal:   new Symbol('_decimal',    SYMBOL_TYPE.VAR, null, 0, new Scope({})),
  _hex:       new Symbol('_hex',        SYMBOL_TYPE.VAR, null, 0, new Scope({})),
  _octal:     new Symbol('_octal',      SYMBOL_TYPE.VAR, null, 0, new Scope({}), (literal) => {
    if ((literal.charAt(0) === '0' && literal.charAt(1) === '0') ||
        (literal.charAt(0) === '0' && (literal.charAt(1) === 'o' || literal.charAt(1) === 'O'))) {
      return `0${literal.substr(2, literal.length - 1)}`;
    }
    return literal;
  }),
  _numeric:   new Symbol('_numeric',    SYMBOL_TYPE.VAR, null, 0, new Scope({})),
  _array:     new Symbol('_array',      SYMBOL_TYPE.VAR, null, 0, new Scope({})),
  _object:    new Symbol('_object',     SYMBOL_TYPE.VAR, null, 0, new Scope({})),
  _null:      new Symbol('_null',       SYMBOL_TYPE.VAR, null, 0, new Scope({})),
  _undefined: new Symbol('_undefined',  SYMBOL_TYPE.VAR, null, 0, new Scope({}), () => { return 'null'; })
});

/**
 * Symbols representing the BSON classes. These are the types for an *instantiated*
 * BSON class, like ObjectId(). There are BsonClasses and BsonSymbols because we
 * need a way to distinguish between the attributes of ObjectId().* and ObjectId.*
 * Even though classes and functions are technically the same thing, it's nice to
 * separate them into different structures so that it's easier to debug. If a user
 * were to define their own class, it would work exactly the same.
 */
const BsonClasses = new Scope({
  Code: new Symbol(
    'Code',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({
      toJSON:           Symbol('CodetoJSON',            SYMBOL_TYPE.FUNC,   [], Types._object,  new Scope({}))
    }),
  ),
  ObjectId: new Symbol(
    'ObjectId',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({
      toHexString:      Symbol('toHexString',       SYMBOL_TYPE.FUNC,   [],                   Types._string,  new Scope({})),
      toString:         Symbol('toString',          SYMBOL_TYPE.FUNC,   [],                   Types._string,  new Scope({})),
      toJSON:           Symbol('toJSON',            SYMBOL_TYPE.FUNC,   [],                   Types._object,  new Scope({}),  (lhs) => { return `${lhs}.toHexString`; }),
      equals:           Symbol('equals',            SYMBOL_TYPE.FUNC,   [ [ 'ObjectId' ] ],   Types._bool,    new Scope({})),
      getTimestamp:     Symbol('getTimestamp',      SYMBOL_TYPE.FUNC,   [],                   Types._integer, new Scope({}))
    })
  ),
  Binary: new Symbol(
    'Binary',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({
      value:            Symbol('value',             SYMBOL_TYPE.FUNC,   [],                   Types._string,  new Scope({}),  (lhs) => { return `${lhs}.getData`; }),
      length:           Symbol('length',            SYMBOL_TYPE.FUNC,   [],                   Types._integer, new Scope({})),
      toString:         Symbol('toString',          SYMBOL_TYPE.FUNC,   [],                   Types._string,  new Scope({})),
      toJSON:           Symbol('toJSON',            SYMBOL_TYPE.FUNC,   [],                   Types._object,  new Scope({}),  (lhs) => { return `${lhs}.toString`; })
    }),
  ),
  DBRef: new Symbol(
    'DBRef',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({
      toJSON:           Symbol('DBReftoJSON',       SYMBOL_TYPE.FUNC,   [],                   Types._object,  new Scope({}),  (lhs) => { return `${lhs}.toString`; })
    })
  ),
  Double: new Symbol(
    'Double',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({
      valueOf:         Symbol('valueOf',            SYMBOL_TYPE.FUNC,   [],                   Types._string,  new Scope({}), (lhs) => { return `${lhs}.doubleValue`; }),
      toJSON:          Symbol('toJSON',             SYMBOL_TYPE.FUNC,   [],                   Types._object,  new Scope({}), (lhs) => { return `${lhs}.doubleValue`; })
    })
  ),
  Int32: new Symbol(
    'Int32',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({
      valueOf:         Symbol('valueOf',            SYMBOL_TYPE.FUNC,   [],                   Types._string,  new Scope({}), (lhs) => { return `${lhs}.intValue`; }),
      toJSON:          Symbol('toJSON',             SYMBOL_TYPE.FUNC,   [],                   Types._object,  new Scope({}), (lhs) => { return `${lhs}.intValue`; })
    })
  ),
  Long: new Symbol(
    'Long',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  ),
  MinKey: new Symbol(
    'MinKey',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({})
  ),
  MaxKey: new Symbol(
    'MaxKey',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({})
  ),
  BSONRegExp: new Symbol(
    'BsonRegExp',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({})
  ),
  Timestamp: new Symbol(
    'Timestamp',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  ),
  Symbol: new Symbol(
    'Symbol',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({
      valueOf:         Symbol('valueOf',            SYMBOL_TYPE.FUNC,   [],                   Types._string,  new Scope({}), (lhs) => { return `${lhs}.getSymbol`; }),
      inspect:         Symbol('inspect',            SYMBOL_TYPE.FUNC,   [],                   Types._string,  new Scope({}), (lhs) => { return `${lhs}.getSymbol`; }),
      toJSON:          Symbol('toJSON',             SYMBOL_TYPE.FUNC,   [],                   Types._object,  new Scope({}), (lhs) => { return `${lhs}.toString`; }),
      toString:        Symbol('toString',           SYMBOL_TYPE.FUNC,   [],                   Types._object,  new Scope({}), (lhs) => { return `${lhs}.toString`; })
    })
  ),
  Decimal128: new Symbol(
    'Decimal128',
    SYMBOL_TYPE.VAR, null, Types._object,
    new Scope({
      toString:         Symbol('toString',          SYMBOL_TYPE.FUNC,   [],                   Types._string,  new Scope({})),
      toJSON:           Symbol('Decimal128toJSON',  SYMBOL_TYPE.FUNC,   [],                   Types._object,  new Scope({}))
    })
  )
});

/**
 * TODO: JS TYPE SYMBOLS
 */
const JSClasses = new Scope({
  Date: new Symbol(
    'Date',
    SYMBOL_TYPE.VAR, null, Types._object,
    new Scope({})
  ),
  RegExp: new Symbol(
    'RegExp',
    SYMBOL_TYPE.VAR, null, Types._object,
    new Scope({})
  )
});

/**
 * Symbols representing the BSON symbols, so the built-in methods and utils
 * accessible from calling `ObjectId.*`. It's callable because it includes the
 * constructor of each type.
 */
const BsonSymbols = new Scope({
  Code: new Symbol(
    'Code',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._string], [Types._object, null] ],
    BsonClasses.Code,
    new Scope({})
  ),
  ObjectId: new Symbol(
    'ObjectId',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [null, Types._string, Types._numeric] ],
    BsonClasses.ObjectId,
    new Scope({
      createFromHexString: Symbol('createFromHexString',    SYMBOL_TYPE.FUNC,   [ [Types._string] ],    BsonClasses.ObjectId,  new Scope({}), () => { return 'new ObjectId'; }),
      createFromTime:      Symbol('ObjectIdcreateFromTime', SYMBOL_TYPE.FUNC,   [ [Types._numeric] ],   BsonClasses.ObjectId,  new Scope({})),
      isValid:             Symbol('isValid',                SYMBOL_TYPE.FUNC,   [ [Types._string] ],    Types._bool,           new Scope({}))
    })
  ),
  Binary: new Symbol(
    'Binary',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._string, Types._numeric, Types._object], [Types._numeric, null] ],
    BsonClasses.Binary,
    new Scope({
      SUBTYPE_DEFAULT:    Symbol('SUBTYPE_DEFAULT',         SYMBOL_TYPE.VAR,  null, Types._integer,  new Scope({}), () => { return 'org.bson.BsonBinarySubType.BINARY'; }),
      SUBTYPE_FUNCTION:   Symbol('SUBTYPE_FUNCTION',        SYMBOL_TYPE.VAR,  null, Types._integer,  new Scope({}), () => { return 'org.bson.BsonBinarySubType.FUNCTION'; }),
      SUBTYPE_BYTE_ARRAY: Symbol('SUBTYPE_BYTE_ARRAY',      SYMBOL_TYPE.VAR,  null, Types._integer,  new Scope({}), () => { return 'org.bson.BsonBinarySubType.OLD_BINARY'; }),
      SUBTYPE_UUID_OLD:   Symbol('SUBTYPE_UUID_OLD',        SYMBOL_TYPE.VAR,  null, Types._integer,  new Scope({}), () => { return 'org.bson.BsonBinarySubType.UUID_LEGACY'; }),
      SUBTYPE_UUID:       Symbol('SUBTYPE_UUID',            SYMBOL_TYPE.VAR,  null, Types._integer,  new Scope({}), () => { return 'org.bson.BsonBinarySubType.UUID'; }),
      SUBTYPE_MD5:        Symbol('SUBTYPE_MD5',             SYMBOL_TYPE.VAR,  null, Types._integer,  new Scope({}), () => { return 'org.bson.BsonBinarySubType.MD5'; }),
      SUBTYPE_USER_DEFINED: Symbol('SUBTYPE_USER_DEFINED',  SYMBOL_TYPE.VAR,  null, Types._integer,  new Scope({}), () => { return 'org.bson.BsonBinarySubType.USER_DEFINED'; })
    })
  ),
  DBRef: new Symbol(
    'DBRef',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._string], [BsonClasses.ObjectId], [Types._string, null] ],
    BsonClasses.DBRef,
    new Scope({}) // TODO
  ),
  Double: new Symbol(
    'Double',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._numeric, Types._string] ],
    BsonClasses.Double,
    new Scope({}), // TODO
    () => { return 'java.lang.Double'; }
  ),
  Int32: new Symbol(
    'Int32',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._numeric, Types._string] ],
    BsonClasses.Int32,
    new Scope({}), // TODO
    () => { return 'java.lang.Integer'; }
  ),
  Long: new Symbol(
    'Long',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._numeric], [Types._numeric] ],
    BsonClasses.Long,
    new Scope({}) // TODO
  ),
  MinKey: new Symbol(
    'MinKey',
    SYMBOL_TYPE.CONSTRUCTOR,
    [],
    BsonClasses.MinKey,
    new Scope({}) // TODO
  ),
  MaxKey: new Symbol(
    'MaxKey',
    SYMBOL_TYPE.CONSTRUCTOR,
    [],
    BsonClasses.MaxKey,
    new Scope({}) // TODO
  ),
  Timestamp: new Symbol(
    'Timestamp',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._numeric ], [Types._numeric] ],
    BsonClasses.Timestamp,
    new Scope({}), // TODO
    () => { return 'BSONTimestamp'; }
  ),
  Symbol: new Symbol(
    'Symbol',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._string] ],
    BsonClasses.Symbol,
    new Scope({}) // TODO
  ),
  BSONRegExp: new Symbol(
    'BSONRegExp',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._string], [BsonClasses._string, null] ],
    BsonClasses.BSONRegExp,
    new Scope({}) // TODO
  ),
  Decimal128: new Symbol(
    'Decimal128',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._object] ],
    BsonClasses.Decimal128,
    new Scope({
      fromString:           Symbol('fromString',            SYMBOL_TYPE.FUNC,   [ [Types._string] ],    BsonClasses.Decimal128, new Scope({}), (lhs) => { return `${lhs}.parse`; })
    })
  )
});

/**
 * TODO: JS Symbols
 */
const JSSymbols = new Scope({
  'Object.create': new Symbol(
    'ObjectCreate',
    SYMBOL_TYPE.FUNC,
    [ [Types._object] ],
    Types._object,
    new Scope({})
  ),
  Number: new Symbol(
    'Number',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._numeric, Types._string] ],
    Types._numeric,
    new Scope({}),
    () => { return 'java.lang.Integer'; }
  ),
  Date: new Symbol(
    'Date',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [] ], // This isn't checked because it has an emit method
    JSClasses.Date,
    new Scope({
      now: Symbol('now', SYMBOL_TYPE.FUNC, [], 'Date', new Scope({}), () => { return 'new java.util.Date'; })
    })
  ),
  RegExp: new Symbol(
    'RegExp',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._string], [Types._string, null] ],
    JSClasses.RegExp,
    new Scope({})
  )
});

/**
 * This is the global scope object. Eventually it will include the built-in
 * language types, the BSON types, and any user-defined types within a scope
 * object.
 */
const Symbols = new Scope(Object.assign(BsonSymbols, JSSymbols));

module.exports = {
  Types,
  BsonClasses,
  JSClasses,
  BsonSymbols,
  JSSymbols,
  Symbols,
  SYMBOL_TYPE
};

