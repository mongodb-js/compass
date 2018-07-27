const chai = require('chai');
const expect = chai.expect;
const compiler = require('..');

const imports = [
  {
    description: 'Single import Code',
    input: '{x: Code("code")}',
    output: {
      java: 'import org.bson.types.Code;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Code',
      javascript: `const {
  Code
} = require('mongo');`
    }
  },
  {
    description: 'Single import Code with scope',
    input: '{x: Code("code", {x: 1})}',
    output: {
      java: `import org.bson.Document;
import org.bson.types.Code;
import org.bson.types.CodeWithScope;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Code',
      javascript: `const {
  Code
} = require('mongo');`
    }
  },
  {
    description: 'Single import ObjectId',
    input: '{x: ObjectId()}',
    output: {
      java: 'import org.bson.types.ObjectId;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import ObjectId',
      javascript: `const {
  ObjectId
} = require('mongo');`
    }
  },
  {
    description: 'Single import Timestamp',
    input: '{x: Timestamp(1, 2)}',
    output: {
      java: 'import org.bson.types.BSONTimestamp;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Timestamp',
      javascript: `const {
  Timestamp
} = require('mongo');`
    }
  },
  {
    description: 'Single import DBRef',
    input: '{x: DBRef("db", ObjectId())}',
    output: {
      java: `import org.bson.types.ObjectId;
import com.mongodb.DBRef;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import ObjectId, DBRef',
      javascript: `const {
  ObjectId,
  DBRef
} = require('mongo');`
    }
  },
  {
    description: 'Single import Double',
    input: '{x: 1}',
    js_input: '{x: Double(1)}',
    output: {
      java: '',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: '',
      javascript: ''
    }
  },
  {
    description: 'Single import NumberInt',
    input: '{x: NumberInt(1)}',
    js_input: '{x: Int32(1)}',
    output: {
      java: '',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: '',
      javascript: `const {
  Int32
} = require('mongo');`
    }
  },
  {
    description: 'Single import NumberLong',
    input: '{x: NumberLong(1)}',
    js_input: '{x: Long(1, 100)}',
    output: {
      java: '',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Int64',
      javascript: `const {
  Long
} = require('mongo');`
    }
  },
  {
    description: 'Single import MinKey',
    input: '{x: MinKey()}',
    output: {
      java: 'import org.bson.types.MinKey;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import MinKey',
      javascript: `const {
  MinKey
} = require('mongo');`
    }
  },
  {
    description: 'Single import MaxKey',
    input: '{x: MaxKey()}',
    output: {
      java: 'import org.bson.types.MaxKey;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import MaxKey',
      javascript: `const {
  MaxKey
} = require('mongo');`
    }
  },
  {
    description: 'Single import RegExp',
    input: '{x: RegExp("abc")}',
    output: {
      java: 'import java.util.regex.Pattern;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;`,
      python: '',
      javascript: ''
    }
  },
  {
    description: 'Single import BSONRegExp',
    js_input: '{x: BSONRegExp("abc")}',
    output: {
      java: 'import org.bson.BsonRegularExpression;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: ''
    }
  },
  {
    description: 'Single import literal regex',
    input: '{x: /abc/g}',
    output: {
      java: 'import java.util.regex.Pattern;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;`,
      python: '',
      javascript: ''
    }
  },
  {
    description: 'Single import Timestamp',
    input: '{x: Timestamp(1, 2)}',
    output: {
      java: 'import org.bson.types.BSONTimestamp;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Timestamp',
      javascript: `const {
  Timestamp
} = require('mongo');`
    }
  },
  {
    description: 'Single import Symbol',
    input: '{x: Symbol("a")}',
    output: {
      java: 'import org.bson.types.Symbol;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: '',
      javascript: `const {
  Symbol
} = require('mongo');`
    }
  },
  {
    description: 'Single import NumberDecimal',
    input: '{x: NumberDecimal(1)}',
    js_input: '{x: Decimal128(1)}',
    output: {
      java: 'import org.bson.types.Decimal128;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Decimal128',
      javascript: `const {
  Decimal128
} = require('mongo');`
    }
  },
  {
    description: 'Single import Date',
    input: '{x: Date()}',
    output: {
      java: 'import java.text.SimpleDateFormat;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System;`,
      python: 'import datetime',
      javascript: ''
    }
  },
  {
    description: 'Single import new Date',
    input: '{x: new Date()}',
    output: {
      java: '',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System;`,
      python: 'import datetime',
      javascript: ''
    }
  },
  {
    description: 'Single import ISODate',
    input: '{x: ISODate()}',
    js_input: '{x: new Date(1)}',
    output: {
      java: '',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System;`,
      python: 'import datetime',
      javascript: ''
    }
  },
  {
    description: 'Multiple imports',
    input: `{
      0: true, 1: 1, 2: NumberLong(100), 3: 0.001, 4: 0x1243, 5: 0o123,
      6: 10, 7: "str", 8: RegExp('10'), '8a': /abc/, 9: [1,2], 10: {x: 1}, 11: null,
      12: undefined, 100: Code("1", {x: 1}), '100a': Code("!"), 101: ObjectId(),
      103: DBRef("c", ObjectId()), 104: 1, 105: NumberInt(1), 106: NumberLong(1),
      107: MinKey(), 108: MaxKey(), 110: Timestamp(1, 100),
      111: Symbol('1'), 112: NumberDecimal(1), 200: Date(), '201a': new Date(),
      '201b': ISODate(), '201c': new ISODate()
    }`,
    js_input: `{
      0: true, 1: 1, 2: Long(1, 100), 3: 0.001, 4: 0x1243, 5: 0o123,
      6: 10, 7: "str", 8: RegExp('10'), '8a': /abc/, 9: [1,2], 10: {x: 1}, 11: null,
      12: undefined, 100: Code("1", {x: 1}), '100a': Code("!"), 101: ObjectId(),
      103: DBRef("c", ObjectId()), 104: Double(1), 105: Int32(1), 106: Long(1, 100),
      107: MinKey(), 108: MaxKey(), 110: Timestamp(1, 100),
      111: Symbol('1'), 112: Decimal128([1]), 200: Date(), '201a': new Date()
    }`,
    output: {
      java: `import java.util.regex.Pattern;
import org.bson.Document;
import org.bson.BsonUndefined;
import org.bson.types.Code;
import org.bson.types.ObjectId;
import com.mongodb.DBRef;
import org.bson.types.MinKey;
import org.bson.types.MaxKey;
import org.bson.types.BSONTimestamp;
import org.bson.types.Symbol;
import org.bson.types.Decimal128;
import org.bson.types.CodeWithScope;
import java.text.SimpleDateFormat;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;
using System;`,
      python: `import datetime
from bson import Code, ObjectId, DBRef, Int64, MinKey, MaxKey, Timestamp, Decimal128`,
      javascript: `const {
  Code,
  ObjectId,
  DBRef,
  Int32,
  Long,
  MinKey,
  MaxKey,
  Timestamp,
  Symbol,
  Decimal128
} = require('mongo');`
    }
  }
];

describe('imports', () => {
  for (const test of imports) {
    describe(`${test.description}`, () => {
      for (const lang of Object.keys(test.output)) {
        if (test.input) {
          it(`correct ${lang} imports from shell`, () => {
            compiler.shell[lang].compile(test.input);
            expect(
              compiler.shell[lang].getImports()
            ).to.equal(test.output[lang]);
          });
        }
        if (test.js_input && lang !== 'javascript') {
          it(`correct ${lang} imports from js`, () => {
            compiler.javascript[lang].compile(test.js_input);
            expect(
              compiler.javascript[lang].getImports()
            ).to.equal(test.output[lang]);
          });
        }
      }
    });
  }
});
