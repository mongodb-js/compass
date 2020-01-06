const Connection = require('../');
const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-subset'));

const tests = [
  {
    description: 'with list of hosts, replicaSet and authSource',
    connectionString:
      'mongodb://mongodb1.example.com:27317,mongodb2.example.com:27017/' +
      '?replicaSet=mySet&readPreference=nearest&authSource=authDB&ssl=true'
  },
  {
    description: 'for ATLAS connection with ssl',
    connectionString:
      'mongodb://ADMINUSER:A_MUCH_LONGER_PASSWORD_should_be_more_secure...@' +
      'a-compass-atlas-test-shard-00-00-vll9l.mongodb.net:38128,' +
      'a-compass-atlas-test-shard-00-01-vll9l.mongodb.net:38128,' +
      'a-compass-atlas-test-shard-00-02-vll9l.mongodb.net:38128/testDB' +
      'ssl=true&replicaSet=a-compass-atlas-test-shard-0&authSource=admin&readPreference=secondary' +
      '?authSource=admin&readPreference=primary&ssl=true'
  },
  {
    description: 'with connectTimeoutMS',
    connectionString:
      'mongodb://mongodb1.example.com:27317,mongodb2.example.com:27017/' +
      '?replicaSet=mySet&connectTimeoutMS=300000&readPreference=primary&authSource=aDifferentAuthDB&ssl=false'
  },
  {
    description: 'with socketTimeoutMS',
    connectionString:
      'mongodb://localhost:27017/sampleDb' +
      '?socketTimeoutMS=30000&w=majority&readPreference=primary&ssl=false'
    // only: true // Uncomment this line to run only one test debugging purpose
  },
  {
    description: 'with compression',
    connectionString:
      'mongodb://localhost:27017/?compressors=snappy%2Czlib&' +
      'readPreference=primary&ssl=false'
  },
  {
    description: 'with zlibCompressionLevel',
    connectionString:
      'mongodb://localhost:27017/?zlibCompressionLevel=9&' +
      'readPreference=primary&ssl=false'
  },
  {
    description:
      'with maxPoolSize, minPoolSize, maxIdleTimeMS, waitQueueMultiple and waitQueueTimeoutMS',
    connectionString:
      'mongodb://localhost:27017,localhost:27018,localhost:27019/databasename?' +
      'replicaSet=rs01&connectTimeoutMS=100000&maxPoolSize=10&minPoolSize=5&maxIdleTimeMS=1000&' +
      'waitQueueMultiple=200&waitQueueTimeoutMS=100&readPreference=primary&ssl=false'
  },
  {
    description: 'with w, wtimeoutMS and journal',
    connectionString:
      'mongodb://localhost:27017/test?' +
      'maxPoolSize=50&minPoolSize=5&maxIdleTimeMS=1000&waitQueueMultiple=200&waitQueueTimeoutMS=100&' +
      'w=1&wTimeoutMS=2000&journal=true&readPreference=primary&ssl=false'
  },
  {
    description: 'with readConcernLevel',
    connectionString:
      'mongodb://db0.example.com:27017,db1.example.com:27017,db2.example.com:27017/?' +
      'replicaSet=myRepl&readConcernLevel=majority&readPreference=primary&ssl=false'
  },
  {
    description:
      'with readPreference, maxStalenessSeconds and readPreferenceTags',
    connectionString:
      'mongodb://mongos1.example.com:27017,mongos2.example.com:27017/?' +
      'readPreference=secondary&maxStalenessSeconds=120&readPreferenceTags=dc%3Any%2Crack%3A1&ssl=false'
  },
  {
    description: 'with authSource and authMechanism',
    connectionString:
      'mongodb://%40rlo:w%40of@localhost:27017/dogdb?authSource=catdb&' +
      'readPreference=primary&authMechanism=SCRAM-SHA-1&ssl=false'
  },
  {
    description: 'with authMechanismProperties and gssapiServiceName',
    connectionString:
      'mongodb://%40rlo:w%40of@localhost:27017/?' +
      'gssapiServiceName=mongodb&authMechanism=GSSAPI&readPreference=primary&' +
      'authSource=%24external&authMechanismProperties=CANONICALIZE_HOST_NAME%3Atrue&' +
      'gssapiCanonicalizeHostName=true&ssl=false&authSource=$external'
  },
  {
    description:
      'with localThresholdMS, serverSelectionTimeoutMS and heartbeatFrequencyMS',
    connectionString:
      'mongodb://localhost:27017/test?replicaSet=test&w=1&' +
      'readPreference=secondary&localThresholdMS=30&' +
      'serverSelectionTimeoutMS=25000&heartbeatFrequencyMS=20000&ssl=true'
  },
  {
    description: 'with serverSelectionTryOnce',
    connectionString:
      'mongodb://a:27017/?readPreference=primary&' +
      'serverSelectionTryOnce=false&ssl=false'
  },
  {
    description: 'with appName',
    connectionString:
      'mongodb://localhost:27017/?readPreference=primary&appname=foo&ssl=false'
  },
  {
    description: 'with retryWrites',
    connectionString:
      'mongodb://hostname:27017/?readPreference=primary&retryWrites=true&ssl=false'
  },
  {
    description: 'with uuidRepresentation',
    connectionString:
      'mongodb://foo:27017/?readPreference=primary&uuidRepresentation=csharpLegacy&ssl=false'
  }
];

describe('connection model', () => {
  describe('should parse a connection string and build the same string back', function() {
    tests.forEach(function(test) {
      const runTest = done =>
        Connection.from(test.connectionString, (error, result) => {
          expect(error).to.not.exist;

          const c = new Connection(result.toJSON());

          expect(c.driverUrl).to.be.equal(test.connectionString);
          done();
        });
      const runMode = test.only ? it.only : it;
      runMode(test.description, runTest);
    });
  });
});
