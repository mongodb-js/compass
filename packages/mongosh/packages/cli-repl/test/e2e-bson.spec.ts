import { expect } from 'chai';
import {
  MongoClient
} from 'mongodb';
import { bson } from '@mongosh/service-provider-core';
import { eventually } from './helpers';
import { TestShell } from './test-shell';
import {
  startTestServer
} from '../../../testing/integration-testing-hooks';

describe('BSON e2e', function() {
  const testServer = startTestServer('shared');
  let db;
  let client;
  let shell: TestShell;
  let dbName;

  beforeEach(async() => {
    const connectionString = await testServer.connectionString();
    dbName = `test-${Date.now()}`;
    shell = TestShell.start({ args: [connectionString] });

    client = await MongoClient.connect(connectionString, {});

    db = client.db(dbName);

    await shell.waitForPrompt();
    shell.assertNoErrors();
  });

  afterEach(async() => {
    await db.dropDatabase();

    await client.close();
  });
  afterEach(TestShell.cleanup);
  describe('printed BSON', () => {
    const outputDoc = {
      ObjectId: 'ObjectId("5f16b8bebe434dc98cdfc9ca")',
      DBRef: 'DBRef("a", "5f16b8bebe434dc98cdfc9cb", "db")',
      MinKey: 'MinKey()',
      MaxKey: 'MaxKey()',
      NumberInt: 'Int32(32)',
      NumberLong: 'Long("64")',
      Timestamp: 'Timestamp(1, 100)',
      Symbol: 'abc',
      Code: 'Code("abc")',
      NumberDecimal: 'Decimal128("1")',
      BinData: 'Binary(Buffer.from("31323334", "hex"), 128)'
    };
    it('Entire doc prints when returned from the server', async() => {
      const buffer = Buffer.from('MTIzNA==', 'base64');
      const inputDoc = {
        ObjectId: new bson.ObjectId('5f16b8bebe434dc98cdfc9ca'),
        DBRef: new bson.DBRef('a', new bson.ObjectId('5f16b8bebe434dc98cdfc9cb'), 'db'),
        MinKey: new bson.MinKey(),
        MaxKey: new bson.MaxKey(),
        Timestamp: new bson.Timestamp(1, 100),
        Symbol: new bson.BSONSymbol('abc'),
        Code: new bson.Code('abc'),
        NumberDecimal: bson.Decimal128.fromString('1'),
        BinData: new bson.Binary(buffer, 128)
      };
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne(inputDoc);
      await shell.writeInputLine('db.test.findOne()');
      await eventually(() => {
        shell.assertContainsOutput(outputDoc.ObjectId);
        shell.assertContainsOutput(outputDoc.DBRef);
        shell.assertContainsOutput(outputDoc.MinKey);
        shell.assertContainsOutput(outputDoc.MaxKey);
        shell.assertContainsOutput(outputDoc.Timestamp);
        shell.assertContainsOutput(outputDoc.Symbol);
        shell.assertContainsOutput(outputDoc.Code);
        shell.assertContainsOutput(outputDoc.NumberDecimal);
        shell.assertContainsOutput(outputDoc.BinData);
      });
      shell.assertNoErrors();
    });
    it('Entire doc prints when created by user', async() => {
      const value = `doc = {
        ObjectId: new ObjectId('5f16b8bebe434dc98cdfc9ca'),
        DBRef: new DBRef('a', '5f16b8bebe434dc98cdfc9cb', 'db'),
        MinKey: new MinKey(),
        MaxKey: new MaxKey(),
        NumberInt: NumberInt("32"),
        NumberLong: NumberLong("64"),
        Timestamp: new Timestamp(1, 100),
        Symbol: new Symbol('abc'),
        Code: new Code('abc'),
        NumberDecimal: NumberDecimal('1'),
        BinData: BinData(128, 'MTIzNA==')
      }\n`;
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput(outputDoc.ObjectId);
        shell.assertContainsOutput(outputDoc.DBRef);
        shell.assertContainsOutput(outputDoc.MinKey);
        shell.assertContainsOutput(outputDoc.MaxKey);
        shell.assertContainsOutput(outputDoc.Timestamp);
        shell.assertContainsOutput(outputDoc.Symbol);
        shell.assertContainsOutput(outputDoc.Code);
        shell.assertContainsOutput(outputDoc.NumberDecimal);
        shell.assertContainsOutput(outputDoc.BinData);
      });
      shell.assertNoErrors();
    });
    it('ObjectId prints when returned from the server', async() => {
      const value = 'ObjectId("5f16b8bebe434dc98cdfc9ca")';
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value');
      await eventually(() => {
        shell.assertContainsOutput(value);
      });
      shell.assertNoErrors();
    });
    it('DBRef prints when returned from the server', async() => {
      const value = new bson.DBRef('coll', new bson.ObjectId('5f16b8bebe434dc98cdfc9ca'));
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value');
      await eventually(() => {
        shell.assertContainsOutput('DBRef("coll", "5f16b8bebe434dc98cdfc9ca")');
      });
      shell.assertNoErrors();
    });
    it('MinKey prints when returned from the server', async() => {
      const value = new bson.MinKey();
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value');
      await eventually(() => {
        shell.assertContainsOutput('MinKey()');
      });
      shell.assertNoErrors();
    });
    it('MaxKey prints when returned from the server', async() => {
      const value = new bson.MaxKey();
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value');
      await eventually(() => {
        shell.assertContainsOutput('MaxKey()');
      });
      shell.assertNoErrors();
    });
    it('Timestamp prints when returned from the server', async() => {
      const value = new bson.Timestamp(0, 100);
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value');
      await eventually(() => {
        shell.assertContainsOutput('Timestamp(0, 100)');
      });
      shell.assertNoErrors();
    });
    it('Code prints when returned from the server', async() => {
      const value = new bson.Code('abc');
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value');
      await eventually(() => {
        shell.assertContainsOutput('Code("abc")');
      });
      shell.assertNoErrors();
    });
    it('Decimal128 prints when returned from the server', async() => {
      const value = bson.Decimal128.fromString('1');
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value');
      await eventually(() => {
        shell.assertContainsOutput('Decimal128("1")');
      });
      shell.assertNoErrors();
    });
    it('BinData prints when returned from the server', async() => {
      const buffer = Buffer.from('MTIzNA==', 'base64');
      const value = new bson.Binary(buffer, 128);
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value');
      await eventually(() => {
        shell.assertContainsOutput('Binary(Buffer.from("31323334", "hex"), 128)');
      });
      shell.assertNoErrors();
    });
    it('ObjectId prints when created by user', async() => {
      const value = 'ObjectId("5f16b8bebe434dc98cdfc9ca")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput(value);
      });
      shell.assertNoErrors();
    });
    it('DBRef prints when created by user', async() => {
      const value = 'DBRef("coll", "5f16b8bebe434dc98cdfc9ca")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput(value);
      });
      shell.assertNoErrors();
    });
    it('MaxKey prints when created by user', async() => {
      const value = 'new MaxKey()';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('MaxKey()');
      });
      shell.assertNoErrors();
    });
    it('MinKey prints when created by user', async() => {
      const value = 'new MinKey()';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('MinKey()');
      });
      shell.assertNoErrors();
    });
    it('NumberInt prints when created by user', async() => {
      const value = 'NumberInt("32.5")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('Int32(32)');
      });
      shell.assertNoErrors();
    });
    it('NumberLong prints when created by user', async() => {
      const value = 'NumberLong("64")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('Long("64")');
      });
      shell.assertNoErrors();
    });
    it('NumberLong prints when created by user (> MAX_SAFE_INTEGER)', async() => {
      const value = 'NumberLong("345678654321234561")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('Long("345678654321234561")');
      });
      shell.assertNoErrors();
    });
    it('Timestamp prints when created by user', async() => {
      const value = 'Timestamp(0, 100)';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput(value);
      });
      shell.assertNoErrors();
    });
    it('Symbol prints when created by user', async() => {
      const value = 'new Symbol("symbol")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('"symbol"');
      });
      shell.assertNoErrors();
    });
    it('Code prints when created by user', async() => {
      const value = 'new Code("abc")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('Code("abc")');
      });
      shell.assertNoErrors();
    });
    it('Code with scope prints when created by user', async() => {
      const value = 'new Code("abc", { s: 1 })';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('Code("abc", {"s":1})');
      });
      shell.assertNoErrors();
    });
    it('Decimal128 prints when created by user', async() => {
      const value = 'NumberDecimal("100")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('Decimal128("100")');
      });
      shell.assertNoErrors();
    });
    // NOTE this is a slight change from the old shell, since the old shell just
    // printed the raw input, while this one converts it to a string.
    it('BinData prints when created by user', async() => {
      const value = 'BinData(128, "MTIzNA==")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('Binary(Buffer.from("31323334", "hex"), 128)');
      });
      shell.assertNoErrors();
    });
    it('BinData prints as UUID when created by user as such', async() => {
      const value = 'UUID("01234567-89ab-cdef-0123-456789abcdef")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput(value);
      });
      shell.assertNoErrors();
    });
    it('BinData prints as MD5 when created by user as such', async() => {
      const value = 'MD5("0123456789abcdef0123456789abcdef")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput(value);
      });
      shell.assertNoErrors();
    });
    it('BinData prints as BinData when created as invalid UUID', async() => {
      const value = 'UUID("abcdef")';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('Binary(Buffer.from("abcdef", "hex"), 4)');
      });
      shell.assertNoErrors();
    });
  });
  describe('help methods', () => {
    // NOTE: the driver returns regular JS objects for Int32, Long
    it('ObjectId has help when returned from the server', async() => {
      const value = new bson.ObjectId();
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value.help()');
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('DBRef has help when returned from the server', async() => {
      const value = new bson.DBRef('coll', new bson.ObjectId());
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value.help');
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('MinKey has help when returned from the server', async() => {
      const value = new bson.MinKey();
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value.help()');
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('MaxKey has help when returned from the server', async() => {
      const value = new bson.MaxKey();
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value.help');
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Timestamp has help when returned from the server', async() => {
      const value = new bson.Timestamp(0, 100);
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value.help()');
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Code has help when returned from the server', async() => {
      const value = new bson.Code('1');
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value.help');
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Decimal128 has help when returned from the server', async() => {
      const value = bson.Decimal128.fromString('1');
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value.help()');
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Binary has help when returned from the server', async() => {
      const buffer = Buffer.from('MTIzNA==', 'base64');
      const value = new bson.Binary(buffer, 128);
      await shell.writeInputLine(`use ${dbName}`);
      await db.collection('test').insertOne({ value: value });
      await shell.writeInputLine('db.test.findOne().value.help');
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('ObjectId has help when created by user', async() => {
      const value = 'new ObjectId()';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('DBRef has help when created by user', async() => {
      const value = 'new DBRef("namespace", "oid")';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('MinKey has help when created by user', async() => {
      const value = 'new MinKey()';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('MaxKey has help when created by user', async() => {
      const value = 'new MaxKey()';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('NumberInt prints when created by user', async() => {
      const value = 'NumberInt("32.5").help';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('NumberLong prints when created by user', async() => {
      const value = 'NumberLong("1").help';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Timestamp has help when created by user', async() => {
      const value = 'new Timestamp(0, 100)';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('Timestamp BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Symbol has help when created by user', async() => {
      const value = 'new Symbol("1")';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Code has help when created by user', async() => {
      const value = 'new Code("1")';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Decimal128 has help when created by user', async() => {
      const value = 'NumberDecimal("1")';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('BinData has help when created by user', async() => {
      const value = 'new BinData(128, "MTIzNA==")';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('ObjectId type has help when created by user', async() => {
      const value = 'ObjectId';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('DBRef type has help when created by user', async() => {
      const value = 'DBRef';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('MinKey type has help when created by user', async() => {
      const value = 'MinKey';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('MaxKey type has help when created by user', async() => {
      const value = 'MaxKey';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('NumberInt type prints when created by user', async() => {
      const value = 'NumberInt.help';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('NumberLong type prints when created by user', async() => {
      const value = 'NumberLong.help';
      await shell.writeInputLine(value);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Timestamp type has help when created by user', async() => {
      const value = 'Timestamp.help';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Code type has help when created by user', async() => {
      const value = 'Code';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('Decimal128 type has help when created by user', async() => {
      const value = 'NumberDecimal';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
    it('BinData type has help when created by user', async() => {
      const value = 'BinData';
      await shell.writeInputLine(`${value}.help`);
      await eventually(() => {
        shell.assertContainsOutput('BSON Class');
      });
      shell.assertNoErrors();
    });
  });
  describe('bsonsize', () => {
    it('works in the shell', async() => {
      const result = await shell.executeLine('({ size: bsonsize({ a: 1 }) })');
      expect(result).to.match(/size: \d+/);
    });
  });
  describe('inheritance', () => {
    it('instanceof works for bson types', async() => {
      expect(await shell.executeLine('ObjectId() instanceof ObjectId')).to.include('true');
      shell.assertNoErrors();
    });
  });
});

