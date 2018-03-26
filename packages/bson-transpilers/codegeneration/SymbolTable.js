/* eslint key-spacing:0, no-multi-spaces:0 */

const SYMBOL_TYPE = { VAR: 0, CONSTRUCTOR: 1, FUNC: 2 };

/**
 * Symbols represent classes, variables, and functions.
 * @param {String} id - identifier. TODO: for now, internals start with _
 * @param {Number} callable - if it's a function, constructor, or variable.
 * @param {Array} args - arguments if its callable. An array of tuples where
 * each tuple has each possible type for the argument at that index.
 * @param {Symbol} type - the type the symbol returns. Could be a Symbol or a type enum.
 * @param {Scope} attrs - the attributes of the returned type.
 *
 * @returns {Symbol}
 */
function Symbol(id, callable, args, type, attrs) {
  return {
    id: id,
    callable: callable,
    args: args,
    type: type,
    attr: attrs
  };
}

/**
 * Scope represents both namespaces and variable scope. Eventually the
 * data structure we're going to use for scopes will have the ability to
 * push/pop scopes, lookup variables, add variables to scope, and handle
 * collisions.
 *
 * @param {Object} attrs - The Symbols within the scope.
 * @return {Scope}
 */
function Scope(attrs) {
  return attrs;
}

let Types = {};
let BsonClasses = {};
let JSClasses = {};
let BsonSymbols = {};
let JSSymbols = {};
let Symbols = {};

/* TYPE ENUM */
const types = Object.freeze({
  STRING: 0, REGEX: 1,
  BOOL: 10,
  INTEGER: 20, DECIMAL: 21, HEXADECIMAL: 22, OCTAL: 23,
  OBJECT: 30, ARRAY: 31,
  NULL: 40, UNDEFINED: 41,
  IDENTIFIER: 50 // FCALL: 51 // FDEF, VARDEF
});

/**
 * Symbols representing the basic language types. Eventually the attrs will be
 * expanded to include built-in functions for each type.
 */
Types = new Scope({
  _string:    new Symbol('_string',     SYMBOL_TYPE.VAR, null, types.STRING,       new Scope({})),
  _regex:     new Symbol('_regex',      SYMBOL_TYPE.VAR, null, types.REGEX,        new Scope({})),
  _bool:      new Symbol('_bool',       SYMBOL_TYPE.VAR, null, types.BOOL,         new Scope({})),
  _integer:   new Symbol('_integer',    SYMBOL_TYPE.VAR, null, types.INTEGER,      new Scope({})),
  _decimal:   new Symbol('_decimal',    SYMBOL_TYPE.VAR, null, types.DECIMAL,      new Scope({})),
  _hex:       new Symbol('_hex',        SYMBOL_TYPE.VAR, null, types.HEXADECIMAL,  new Scope({})),
  _octal:     new Symbol('_octal',      SYMBOL_TYPE.VAR, null, types.OCTAL,        new Scope({})),
  _numeric:   new Symbol('_numeric',    SYMBOL_TYPE.VAR, null, types.INTEGER,      new Scope({})),
  _array:     new Symbol('_array',      SYMBOL_TYPE.VAR, null, types.ARRAY,        new Scope({})),
  _object:    new Symbol('_object',     SYMBOL_TYPE.VAR, null, types.OBJECT,       new Scope({})),
  _null:      new Symbol('_null',       SYMBOL_TYPE.VAR, null, types.NULL,         new Scope({})),
  _undefined: new Symbol('_undefined',  SYMBOL_TYPE.VAR, null, types.UNDEFINED,    new Scope({}))
});

/**
 * Symbols representing the BSON classes. These are the types for an *instantiated*
 * BSON class, like ObjectId(). There are BsonClasses and BsonSymbols because we
 * need a way to distinguish between the attributes of ObjectId().* and ObjectId.*
 */
BsonClasses = new Scope({
  Code: new Symbol(
    'Code',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({
      toJSON:           Symbol('toJSON',            SYMBOL_TYPE.FUNC,   [],                           Types._object,        new Scope({}))
    }),
  ),
  ObjectId: new Symbol(
    'ObjectId',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({
      toHexString:      Symbol('toHexString',       SYMBOL_TYPE.FUNC,   [],                           Types._string,        new Scope({})),
      toString:         Symbol('toString',          SYMBOL_TYPE.FUNC,   [],                           Types._string,        new Scope({})),
      toJSON:           Symbol('toJSON',            SYMBOL_TYPE.FUNC,   [],                           Types._object,        new Scope({})),
      equals:           Symbol('equals',            SYMBOL_TYPE.FUNC,   [ [BsonClasses.ObjectId] ],   Types._bool,          new Scope({})),
      generate:         Symbol('generate',          SYMBOL_TYPE.FUNC,   [],                           BsonClasses.ObjectId, new Scope({}))
    })
  ),
  Binary: new Symbol(
    'Binary',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({
      put:              Symbol('put',               SYMBOL_TYPE.FUNC,   [ [Types._string] ],                    null,           new Scope({})),
      write:            Symbol('write',             SYMBOL_TYPE.FUNC,   [ [Types._string, Types._object],
                                                                          [Types._integer] ],                   null,           new Scope({})),
      read:             Symbol('read',              SYMBOL_TYPE.FUNC,   [ [Types._integer], [Types._integer] ], Types._object,  new Scope({})),
      value:            Symbol('value',             SYMBOL_TYPE.FUNC,   [],                                     Types._string,  new Scope({})),
      length:           Symbol('length',            SYMBOL_TYPE.FUNC,   [],                                     Types._integer, new Scope({})),
      toString:         Symbol('toString',          SYMBOL_TYPE.FUNC,   [],                                     Types._string,  new Scope({})),
      toJSON:           Symbol('toJSON',            SYMBOL_TYPE.FUNC,   [],                                     Types._object,  new Scope({}))
    }),
  ),
  DBRef: new Symbol(
    'DBRef',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  ),
  Double: new Symbol(
    'Double',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  ),
  Int32: new Symbol(
    'Int32',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  ),
  Long: new Symbol(
    'Long',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  ),
  MinKey: new Symbol(
    'MinKey',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  ),
  MaxKey: new Symbol(
    'MaxKey',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  ),
  BSONRegExp: new Symbol(
    'BsonRegExp',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  ),
  Timestamp: new Symbol(
    'Timestamp',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  ),
  Symbol: new Symbol(
    'Symbol',
    SYMBOL_TYPE.VAR, null, Types._object, // not sure this makes sense
    new Scope({}) // TODO
  )
});

/**
 * TODO: JS TYPE SYMBOLS
 */
JSClasses = new Scope({});

/**
 * Symbols representing the BSON symbols, so the built-in methods and utils
 * accessible from calling `ObjectId.*`. It's callable because it includes the
 * constructor of each type.
 */
BsonSymbols = new Scope({
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
      createFromHexStr: Symbol('createFromHexStr',    SYMBOL_TYPE.FUNC,   [ [Types._string] ],    BsonClasses.ObjectId,  new Scope({})),
      createFromTime:   Symbol('createFromTime',      SYMBOL_TYPE.FUNC,   [ [Types._numeric] ],   BsonClasses.ObjectId,  new Scope({})),
      isValid:          Symbol('isValid',             SYMBOL_TYPE.FUNC,   [],                     Types._bool,           new Scope({}))
    })
  ),
  Binary: new Symbol(
    'Binary',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._string, Types._numeric, Types._object], [Types._numeric, null] ],
    BsonClasses.Binary,
    new Scope({
      SUBTYPE_DEFAULT:    Symbol('SUBTYPE_DEFAULT',   SYMBOL_TYPE.VAR,  null,            Types._integer,  new Scope({})),
      SUBTYPE_FUNCTION:   Symbol('SUBTYPE_DEFAULT',   SYMBOL_TYPE.VAR,  null,            Types._integer,  new Scope({})),
      SUBTYPE_BYTE_ARRAY: Symbol('SUBTYPE_DEFAULT',   SYMBOL_TYPE.VAR,  null,            Types._integer,  new Scope({})),
      SUBTYPE_UUID_OLD:   Symbol('SUBTYPE_DEFAULT',   SYMBOL_TYPE.VAR,  null,            Types._integer,  new Scope({})),
      SUBTYPE_UUID:       Symbol('SUBTYPE_DEFAULT',   SYMBOL_TYPE.VAR,  null,            Types._integer,  new Scope({})),
      SUBTYPE_MD5:        Symbol('SUBTYPE_DEFAULT',   SYMBOL_TYPE.VAR,  null,            Types._integer,  new Scope({})),
      SUBTYPE_USER_DEFINED: Symbol('SUBTYPE_DEFAULT', SYMBOL_TYPE.VAR,  null,            Types._integer,  new Scope({}))
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
    new Scope({}) // TODO
  ),
  Int32: new Symbol(
    'Int32',
    SYMBOL_TYPE.CONSTRUCTOR,
    [ [Types._numeric, Types._string] ],
    BsonClasses.Int32,
    new Scope({}) // TODO
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
    new Scope({}) // TODO
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
  )
});

/**
 * TODO: JS Symbols
 */
JSSymbols = new Scope({
  'Object.create': new Symbol(
    'ObjectCreate',
    SYMBOL_TYPE.FUNC,
    [ [Types._object] ],
    Types._object,
    new Scope({})
  )
});

/**
 * This is the global scope object. Eventually it will include the built-in
 * language types, the BSON types, and any user-defined types within a scope
 * object.
 */
Symbols = new Scope(Object.assign(BsonSymbols, JSSymbols));

module.exports = {
  Types,
  BsonClasses,
  JSClasses,
  BsonSymbols,
  JSSymbols,
  Symbols,
  SYMBOL_TYPE
};

