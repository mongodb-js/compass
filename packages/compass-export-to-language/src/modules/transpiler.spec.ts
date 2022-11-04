import { expect } from 'chai';
import { getInputExpressionMode, runTranspiler } from './transpiler';

describe('transpiler', function () {
  describe('getInputExpressionMode', function () {
    it('returns Query for basic queries', function () {
      expect(getInputExpressionMode({ filter: 'foo' })).to.equal('Query');
    });

    it('returns Query for full queries', function () {
      expect(
        getInputExpressionMode({
          filter: 'x',
          project: 'x',
          sort: 'x',
          collation: 'x',
          skip: 'x',
          limit: 'x',
          maxTimeMS: 'x',
        })
      ).to.equal('Query');
    });

    it('returns Pipeline for aggregations', function () {
      expect(getInputExpressionMode({ aggregation: 'foo' })).to.equal(
        'Pipeline'
      );
    });
  });

  describe('runTranspiler', function () {
    let defaults;
    let queryExpression;
    let aggregationExpression;

    beforeEach(function () {
      defaults = {
        outputLanguage: 'python' as const,
        includeImports: false,
        includeDrivers: false,
        useBuilders: false,
        uri: 'uri',
        namespace: 'namespace',
      };

      queryExpression = { filter: '{ foo: 1 }' };
      aggregationExpression = { aggregation: '[{ $match: { foo: 1 }}]' };
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
      ).to.equal(`

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
  'uri',
  { useNewUrlParser: true, useUnifiedTopology: true }
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
        "uri"
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

      expect(output).to.equal(`import org.bson.Document;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.conversions.Bson;
import java.util.concurrent.TimeUnit;
import org.bson.Document;
/*
 * Requires the MongoDB Java Driver.
 * https://mongodb.github.io/mongo-java-driver
 */
Bson filter = eq("foo", 1L);
MongoClient mongoClient = new MongoClient(
    new MongoClientURI(
        "uri"
    )
);
MongoDatabase database = mongoClient.getDatabase("namespace");
MongoCollection<Document> collection = database.getCollection("");
FindIterable<Document> result = collection.find(filter);`);
    });
  });
});
