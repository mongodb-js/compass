/* eslint key-spacing:0 no-multi-spaces:0 */
/*
A Symbol: (identifier, callable, arguments, type)
A Scope: [ { id --> Symbol }* ]

NamespaceScope: { id --> Scope }

GlobalScope: { id --> Symbol }
*/

/* SYMBOL + SCOPE OBJECTS */
function Symbol(id, callable, args, type, attrs, ns) {
  return {
    id: id,               // identifier for the type
    callable: callable,   // if it's a function
    args: args,           // args if it is a function
    type: type,           // return type
    attr: attrs,          // if it's an object being returned, get attrs of the returned type
  };
}
function Scope(attrs) {
  return attrs;
}

/* TYPE ENUM */
const types = Object.freeze({
  STRING: 0, REGEX: 1,
  BOOL: 10,
  INTEGER: 20, DECIMAL: 21, HEXADECIMAL: 22, OCTAL: 23,
  OBJECT: 30, ARRAY: 31,
  NULL: 40, UNDEFINED: 41,
  IDENTIFIER: 50//, FCALL: 51 // FDEF, VARDEF
});

/* TYPE SYMBOLS */
const type_table = Scope({
  _string:    new Symbol('', false, [], types.STRING,       null),
  _regex:     new Symbol('', false, [], types.REGEX,        null),
  _bool:      new Symbol('', false, [], types.BOOL,         null),
  _integer:   new Symbol('', false, [], types.INTEGER,      null),
  _decimal:   new Symbol('', false, [], types.DECIMAL,      null),
  _hex:       new Symbol('', false, [], types.HEXADECIMAL,  null),
  _octal:     new Symbol('', false, [], types.OCTAL,        null),
  _array:     new Symbol('', false, [], types.ARRAY,        null),
  _object:    new Symbol('', false, [], types.OBJECT,       null),
  _null:      new Symbol('', false, [], types.NULL,         null),
  _undefined: new Symbol('', false, [], types.UNDEFINED,    null)
});

/* BSON TYPE SYMBOLS */
let bson_type_table = {};
bson_type_table = Scope({
  Code: new Symbol(
    'Code',
    false, null, type_table._object, // not sure this makes sense
    new Scope({
      toJSON:           Symbol('toJSON',            true,   [],                           type_table._object)
    }),
  ),
  ObjectId: new Symbol(
    'ObjectId',
    false, null, type_table._object, // not sure this makes sense
    new Scope({
      toHexString:      Symbol('toHexString',       true,   [],                           type_table._string),
      toString:         Symbol('toString',          true,   [],                           type_table._string),
      toJSON:           Symbol('toJSON',            true,   [],                           type_table._object),
      equals:           Symbol('equals',            true,   [bson_type_table.ObjectId],   type_table._bool),
      generate:         Symbol('generate',          true,   [],                           bson_type_table.ObjectId)
    })
  ),
  Binary: new Symbol(
    'Binary',
    false, null, type_table._object, // not sure this makes sense
    new Scope({
      put:              Symbol('put',               true,   [type_table._string],                       null),
      write:            Symbol('write',             true,   [type_table._string,  type_table._integer], null),
      read:             Symbol('read',              true,   [type_table._integer, type_table._integer], type_table._object),
      value:            Symbol('value',             true,   [],                                         type_table._string),
      length:           Symbol('length',            true,   [],                                         type_table._integer),
      toString:         Symbol('toString',          true,   [],                                         type_table._string),
      toJSON:           Symbol('toJSON',            true,   [],                                         type_table._object)
    }),
  )
});

/* USER DEFINED TYPE SYMBOLS */
const user_defined_types = new Scope({});

/* BSON SYMBOLS */
let bson_symbols = new Scope({});
bson_symbols = new Scope({
  Code: new Symbol(
    'Code',
    true,
    [ type_table._string, type_table._object ],
    type_table.Code,
    null
  ),
  ObjectId: new Symbol(
    'ObjectId',
    true,
    [type_table._string],
    type_table.ObjectId,
    new Scope({
      createFromHexStr: Symbol('createFromHexStr',    true,   [type_table._hex],    type_table.ObjectId),
      createFromTime:   Symbol('createFromTime',      true,   [type_table._object], type_table.ObjectId),
      isValid:          Symbol('isValid',             true,   [],                   type_table._bool)
    })
  ),
  Binary: new Symbol(
    'Binary',
    true,
    [type_table._string],
    type_table.Binary,
    new Scope({
      SUBTYPE_DEFAULT:    Symbol('SUBTYPE_DEFAULT',   false,  null,                 type_table._integer),
      SUBTYPE_FUNCTION:   Symbol('SUBTYPE_DEFAULT',   false,  null,                 type_table._integer),
      SUBTYPE_BYTE_ARRAY: Symbol('SUBTYPE_DEFAULT',   false,  null,                 type_table._integer),
      SUBTYPE_UUID_OLD:   Symbol('SUBTYPE_DEFAULT',   false,  null,                 type_table._integer),
      SUBTYPE_UUID:       Symbol('SUBTYPE_DEFAULT',   false,  null,                 type_table._integer),
      SUBTYPE_MD5:        Symbol('SUBTYPE_DEFAULT',   false,  null,                 type_table._integer),
      SUBTYPE_USER_DEFINED: Symbol('SUBTYPE_DEFAULT', false,  null,                 type_table._integer),
    })
  )
});

module.exports = {
  type_table,
  bson_type_table,
  bson_symbols
};

