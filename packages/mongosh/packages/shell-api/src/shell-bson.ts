import { ALL_PLATFORMS, ALL_SERVER_VERSIONS, ALL_TOPOLOGIES, ServerVersions } from './enums';
import Help from './help';
import { BinaryType, bson as BSON } from '@mongosh/service-provider-core';
import { CommonErrors, MongoshInternalError, MongoshInvalidInputError } from '@mongosh/errors';
import { assertArgsDefinedType } from './helpers';
import { randomBytes } from 'crypto';

function constructHelp(className: string): Help {
  const classHelpKeyPrefix = `shell-api.classes.${className}.help`;
  const classHelp = {
    help: `${classHelpKeyPrefix}.description`,
    example: `${classHelpKeyPrefix}.example`,
    docs: `${classHelpKeyPrefix}.link`,
    attr: []
  };
  return new Help(classHelp);
}

/**
 * This method modifies the BSON class passed in as argument. This is required so that
 * we can have help, serverVersions, and other metadata on the bson classes constructed by the user.
 */
export default function constructShellBson(bson: typeof BSON, printWarning: (msg: string) => void): any {
  const bsonNames = [
    'Binary', 'Code', 'DBRef', 'Decimal128', 'Double', 'Int32', 'Long',
    'MaxKey', 'MinKey', 'ObjectId', 'Timestamp', 'Map', 'BSONSymbol'
  ] as const; // Statically set this so we can error if any are missing

  // If the service provider doesn't provide a BSON version, use service-provider-core's BSON package (js-bson 4.x)
  if (bson === undefined) {
    bson = BSON;
  }
  const helps: any = {};
  bsonNames.forEach((className) => {
    if (!(className in bson)) {
      throw new MongoshInternalError(`${className} does not exist in provided BSON package.`);
    }
    const proto = bson[className].prototype as any;
    proto.serverVersions = ALL_SERVER_VERSIONS;
    proto.platforms = ALL_PLATFORMS;
    proto.topologies = ALL_TOPOLOGIES;

    const help = constructHelp(className);
    helps[className] = help;
    proto.help = (): Help => (help);
    Object.setPrototypeOf(proto.help, help);
  });
  // Symbol is deprecated
  (bson.BSONSymbol as any).prototype.serverVersions = [ ServerVersions.earliest, '1.6.0' ];
  (bson.BSONSymbol as any).prototype.deprecated = true;

  const bsonPkg = {
    DBRef: Object.assign(function(namespace: string, oid: any, db?: string): any {
      assertArgsDefinedType([namespace, oid, db], ['string', true, [undefined, 'string']], 'DBRef');
      return new bson.DBRef(namespace, oid, db);
    }, { prototype: bson.DBRef.prototype }),
    // DBPointer not available in the bson 1.x library, but depreciated since 1.6
    Map: bson.Map,
    bsonsize: function(object: any): any {
      assertArgsDefinedType([object], ['object'], 'bsonsize');
      return bson.calculateObjectSize(object);
    },
    MaxKey: Object.assign(function(): any {
      return new bson.MaxKey();
    }, { prototype: bson.MaxKey.prototype }),
    MinKey: Object.assign(function(): any {
      return new bson.MinKey();
    }, { prototype: bson.MinKey.prototype }),
    ObjectId: Object.assign(function(id?: string): any {
      assertArgsDefinedType([id], [[undefined, 'string']], 'ObjectId');
      return new bson.ObjectId(id);
    }, { prototype: bson.ObjectId.prototype }),
    Symbol: Object.assign(function(value = ''): any {
      return new bson.BSONSymbol(value);
    }, { prototype: bson.BSONSymbol.prototype }),
    Timestamp: Object.assign(function(low = 0, high = 0): any {
      assertArgsDefinedType([low, high], ['number', 'number'], 'Timestamp');
      return new bson.Timestamp(low, high);
    }, { prototype: bson.Timestamp.prototype }),
    Code: Object.assign(function(c: any = '', s?: any): any {
      assertArgsDefinedType([c, s], [[undefined, 'string'], [undefined, 'object']], 'Code');
      return new bson.Code(c, s);
    }, { prototype: bson.Code.prototype }),
    NumberDecimal: Object.assign(function(s = '0'): any {
      assertArgsDefinedType([s], [['string', 'number']], 'NumberDecimal');
      if (typeof s === 'string') {
        return bson.Decimal128.fromString(s);
      }
      printWarning('NumberDecimal: specifying a number as argument is deprecated and may lead to loss of precision');
      return bson.Decimal128.fromString(`${s}`);
    }, { prototype: bson.Decimal128.prototype }),
    NumberInt: Object.assign(function(v = '0'): any {
      assertArgsDefinedType([v], [['string', 'number']], 'NumberInt');
      return new bson.Int32(parseInt(`${v}`, 10));
    }, { prototype: bson.Int32.prototype }),
    NumberLong: Object.assign(function(s: string | number = '0'): any {
      assertArgsDefinedType([s], [['string', 'number']], 'NumberLong');
      if (typeof s === 'string') {
        return bson.Long.fromString(s);
      }
      printWarning('NumberLong: specifying a number as argument is deprecated and may lead to loss of precision');
      return bson.Long.fromInt(s);
    }, { prototype: bson.Long.prototype }),
    ISODate: function(input?: string): Date {
      if (!input) input = new Date().toISOString();
      const isoDateRegex =
        /^(?<Y>\d{4})-?(?<M>\d{2})-?(?<D>\d{2})([T ](?<h>\d{2})(:?(?<m>\d{2})(:?((?<s>\d{2})(\.(?<ms>\d+))?))?)?(?<tz>Z|([+-])(\d{2}):?(\d{2})?)?)?$/;
      const match = input.match(isoDateRegex);
      if (match !== null && match.groups !== undefined) {
        // Normalize the representation because ISO-8601 accepts e.g.
        // '20201002T102950Z' without : and -, but `new Date()` does not.
        const { Y, M, D, h, m, s, ms, tz } = match.groups;
        const normalized =
          `${Y}-${M}-${D}T${h || '00'}:${m || '00'}:${s || '00'}.${ms || '000'}${tz || 'Z'}`;
        const date = new Date(normalized);
        // Make sur we're in the range 0000-01-01T00:00:00.000Z - 9999-12-31T23:59:59.999Z
        if (date.getTime() >= -62167219200000 && date.getTime() <= 253402300799999) {
          return date;
        }
      }
      throw new MongoshInvalidInputError(`${JSON.stringify(input)} is not a valid ISODate`, CommonErrors.InvalidArgument);
    },
    BinData: Object.assign(function(subtype: number, b64string: string): BinaryType { // this from 'help misc' in old shell
      assertArgsDefinedType([subtype, b64string], ['number', 'string'], 'BinData');
      const buffer = Buffer.from(b64string, 'base64');
      return new bson.Binary(buffer, subtype);
    }, { prototype: bson.Binary.prototype }),
    HexData: Object.assign(function(subtype: number, hexstr: string): BinaryType {
      assertArgsDefinedType([subtype, hexstr], ['number', 'string'], 'HexData');
      const buffer = Buffer.from(hexstr, 'hex');
      return new bson.Binary(buffer, subtype);
    }, { prototype: bson.Binary.prototype }),
    UUID: Object.assign(function(hexstr?: string): BinaryType {
      if (hexstr === undefined) {
        // Generate a version 4, variant 1 UUID, like the old shell did.
        const uuid = randomBytes(16);
        uuid[6] = (uuid[6] & 0x0f) | 0x40;
        uuid[8] = (uuid[8] & 0x3f) | 0x80;
        hexstr = uuid.toString('hex');
      }
      assertArgsDefinedType([hexstr], ['string'], 'UUID');
      // Strip any dashes, as they occur in the standard UUID formatting
      // (e.g. 01234567-89ab-cdef-0123-456789abcdef).
      const buffer = Buffer.from((hexstr as string).replace(/-/g, ''), 'hex');
      return new bson.Binary(buffer, bson.Binary.SUBTYPE_UUID);
    }, { prototype: bson.Binary.prototype }),
    MD5: Object.assign(function(hexstr: string): BinaryType {
      assertArgsDefinedType([hexstr], ['string'], 'MD5');
      const buffer = Buffer.from(hexstr, 'hex');
      return new bson.Binary(buffer, bson.Binary.SUBTYPE_MD5);
    }, { prototype: bson.Binary.prototype }),
    // Add the driver types to bsonPkg so we can deprecate the shell ones later
    Decimal128: bson.Decimal128,
    BSONSymbol: bson.BSONSymbol,
    Int32: bson.Int32,
    Long: bson.Long,
    Binary: bson.Binary,
    Double: bson.Double,
    EJSON: bson.EJSON
  } as any;

  Object.keys(bsonPkg).forEach((className) => {
    const help = helps[className] || constructHelp(className);
    bsonPkg[className].help = (): Help => (help);
    Object.setPrototypeOf(bsonPkg[className].help, help);
  });
  return bsonPkg;
}
