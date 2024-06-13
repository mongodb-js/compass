import { expect } from 'chai';
import { runTranspiler } from './transpiler';
import type { InputExpression } from './transpiler';

describe('transpiler', function () {
  describe('runTranspiler', function () {
    let defaults: Pick<
      Parameters<typeof runTranspiler>[0],
      | 'outputLanguage'
      | 'includeDrivers'
      | 'includeImports'
      | 'useBuilders'
      | 'uri'
      | 'namespace'
      | 'protectConnectionStrings'
    >;
    let queryExpression: InputExpression;
    let aggregationExpression: InputExpression;

    beforeEach(function () {
      defaults = {
        outputLanguage: 'python',
        includeImports: false,
        includeDrivers: false,
        useBuilders: false,
        uri: 'mongodb://foo:bar@mongodb.net',
        namespace: 'namespace',
        protectConnectionStrings: false,
      } as const;

      queryExpression = { filter: '{ foo: 1 }', exportMode: 'Query' };
      aggregationExpression = {
        aggregation: '[{ $match: { foo: 1 }}]',
        exportMode: 'Pipeline',
      };
    });

    it('transpiles a query', function () {
      expect(runTranspiler({ ...defaults, inputExpression: queryExpression }))
        .to.equal(`{
    'foo': 1
}`);
    });

    it('transpiles an aggregation', function () {
      expect(
        runTranspiler({ ...defaults, inputExpression: aggregationExpression })
      ).to.equal(`[
    {
        '$match': {
            'foo': 1
        }
    }
]`);
    });

    it('transpiles to a Rust query with imports', function () {
      expect(
        runTranspiler({
          ...defaults,
          outputLanguage: 'rust',
          inputExpression: queryExpression,
          includeImports: true,
        })
      ).to.equal(`use mongodb::bson::doc;

doc! {
    "foo": 1
}`);
    });

    it('transpiles to a Node (Javascript) query with drivers', function () {
      expect(
        runTranspiler({
          ...defaults,
          outputLanguage: 'javascript',
          inputExpression: queryExpression,
          includeDrivers: true,
        })
      ).to.equal(`/*
 * Requires the MongoDB Node.js Driver
 * https://mongodb.github.io/node-mongodb-native
 */

const filter = {
  'foo': 1
};

const client = await MongoClient.connect(
  'mongodb://foo:bar@mongodb.net'
);
const coll = client.db('namespace').collection('');
const cursor = coll.find(filter);
const result = await cursor.toArray();
await client.close();`);
    });

    it('transpiles to a Java query with drivers and builders', function () {
      const output = runTranspiler({
        ...defaults,
        outputLanguage: 'java',
        inputExpression: queryExpression,
        includeDrivers: true,
      }).replace(/\s+$/gm, ''); // remove spaces at the end of lines

      expect(output).to.equal(`/*
 * Requires the MongoDB Java Driver.
 * https://mongodb.github.io/mongo-java-driver
 */
Bson filter = new Document("foo", 1L);
MongoClient mongoClient = new MongoClient(
    new MongoClientURI(
        "mongodb://foo:bar@mongodb.net"
    )
);
MongoDatabase database = mongoClient.getDatabase("namespace");
MongoCollection<Document> collection = database.getCollection("");
FindIterable<Document> result = collection.find(filter);`);
    });

    it('transpiles to a Java query with imports, drivers and builders', function () {
      const output = runTranspiler({
        ...defaults,
        outputLanguage: 'java',
        inputExpression: queryExpression,
        includeImports: true,
        includeDrivers: true,
        useBuilders: true,
      }).replace(/\s+$/gm, ''); // remove spaces at the end of lines

      expect(output).to
        .equal(`import static com.mongodb.client.model.Filters.eq;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.conversions.Bson;
import java.util.concurrent.TimeUnit;
import org.bson.Document;
import com.mongodb.client.FindIterable;
/*
 * Requires the MongoDB Java Driver.
 * https://mongodb.github.io/mongo-java-driver
 */
Bson filter = eq("foo", 1L);
MongoClient mongoClient = new MongoClient(
    new MongoClientURI(
        "mongodb://foo:bar@mongodb.net"
    )
);
MongoDatabase database = mongoClient.getDatabase("namespace");
MongoCollection<Document> collection = database.getCollection("");
FindIterable<Document> result = collection.find(filter);`);
    });

    for (const protectConnectionStrings of [false, true]) {
      // Security-relevant test -- description is in the protect-connection-strings e2e test.
      context(
        `when protect connection strings is ${protectConnectionStrings}`,
        function () {
          it('showes/hides the connection string as appropriate', function () {
            const uri = protectConnectionStrings
              ? 'mongodb://<credentials>@mongodb.net/'
              : 'mongodb://foo:bar@mongodb.net';

            expect(
              runTranspiler({
                ...defaults,
                outputLanguage: 'javascript',
                inputExpression: queryExpression,
                includeDrivers: true,
                protectConnectionStrings,
              })
            ).to.equal(`/*
 * Requires the MongoDB Node.js Driver
 * https://mongodb.github.io/node-mongodb-native
 */

const filter = {
  'foo': 1
};

const client = await MongoClient.connect(
  '${uri}'
);
const coll = client.db('namespace').collection('');
const cursor = coll.find(filter);
const result = await cursor.toArray();
await client.close();`);
          });
        }
      );
    }
  });
});
