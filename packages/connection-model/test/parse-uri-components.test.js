const Connection = require('../');
const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');

// To test SRV connection strings we need to use `proxyquire`.
// Because driver parser resolves the SRV record and uses the result as the list
// of hosts to connect to. Since tests don't have real data that can be resolved
// the driver check would always fail.
// To make tests work we need to mock dns methods.
let stubHostname = '';
const stubs = {
  dns: {
    resolveSrv: (uri, callback) => callback(null, [{ name: stubHostname }]),
    resolveTxt: (addresses, callback) => callback(null),
    // To get access to the deeply nested dependencies we need to move them to the global level
    '@global': true
  }
};
const stubedConnection = proxyquire('../', stubs);

chai.use(require('chai-subset'));

describe('connection model partser should parse URI components such as', () => {
  describe('prefix', () => {
    it('should set isSrvRecord to false', (done) => {
      Connection.from(
        'mongodb://mongodb1.example.com:27317,mongodb2.example.com:27017/?replicaSet=mySet&authSource=authDB',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.isSrvRecord).to.be.equal(false);
          done();
        }
      );
    });

    it('should set isSrvRecord to true', (done) => {
      stubHostname = 'server.example.com';
      stubedConnection.from(
        `mongodb+srv://${stubHostname}/?connectTimeoutMS=300000&authSource=aDifferentAuthDB`,
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.isSrvRecord).to.be.equal(true);
          done();
        }
      );
    });

    it('should catch ampersand validation errors', (done) => {
      stubHostname = 'server.example.com';
      stubedConnection.from(
        // note: socketTimeoutMS=1&socketTimeoutMS=2 will cause the validation to fail,
        // as socketTimeoutMS is expected to be a number, instead will be parsed as an array:
        `mongodb+srv://${stubHostname}/?connectTimeoutMS=300000&authSource=aDifferentAuthDB&socketTimeoutMS=1&socketTimeoutMS=2`,
        (error) => {
          expect(error).to.exist;
          expect(error.message).to.contain('Property \'socketTimeoutMS\' must be of type number');
          done();
        }
      );
    });

    it('should set only one hostname without decorating it with the replica set info', (done) => {
      stubHostname = 'test.mongodb.net';
      stubedConnection.from(
        `mongodb+srv://admin:qwerty@${stubHostname}/admin`,
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.isSrvRecord).to.be.equal(true);
          expect(result.hostname).to.be.equal('test.mongodb.net');
          done();
        }
      );
    });
  });

  describe('authentication credentials', () => {
    it('should parse username and password', (done) => {
      Connection.from(
        'mongodb://someUsername:testPassword@localhost',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.hostname).to.be.equal('localhost');
          expect(result).to.have.property('auth');
          expect(result.mongodbUsername).to.be.equal('someUsername');
          expect(result.mongodbPassword).to.be.equal('testPassword');
          expect(result.ns).to.be.equal('test');
          expect(result.authStrategy).to.be.equal('MONGODB');
          done();
        }
      );
    });

    it('should not return authentication info', (done) => {
      Connection.from('mongodb://localhost', (error, result) => {
        expect(error).to.not.exist;
        expect(result.hostname).to.be.equal('localhost');
        expect(result.authStrategy).to.be.equal('NONE');
        done();
      });
    });
  });

  describe('the host and optional port number', () => {
    it('should parse host and port', (done) => {
      Connection.from('mongodb://host:27018', (error, result) => {
        expect(error).to.not.exist;
        expect(result.hostname).to.be.equal('host');
        expect(result.hosts[0].host).to.equal('host');
        expect(result.hosts[0].port).to.equal(27018);
        done();
      });
    });

    it('should provide a default port if one is not provided', (done) => {
      Connection.from('mongodb://host', (error, result) => {
        expect(error).to.not.exist;
        expect(result.hostname).to.be.equal('host');
        expect(result.hosts[0].host).to.equal('host');
        expect(result.hosts[0].port).to.equal(27017);
        done();
      });
    });
  });

  describe('the name of the database to authenticate', () => {
    it('should parse a database name', (done) => {
      Connection.from(
        'mongodb://root:password123@localhost:27017/databasename',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.mongodbUsername).to.equal('root');
          expect(result.mongodbPassword).to.equal('password123');
          done();
        }
      );
    });
  });

  describe('connection string options that include', () => {
    describe('replica set options', () => {
      it('should parse replicaSet', (done) => {
        Connection.from(
          'mongodb://db0.example.com:27017,db1.example.com:27017,db2.example.com:27017/admin?replicaSet=myRepl',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.replicaSet).to.be.equal('myRepl');
            expect(result.hostname).to.be.equal('db0.example.com');
            expect(result.port).to.be.equal(27017);
            expect(result.ns).to.be.equal('admin');
            done();
          }
        );
      });
    });

    describe('connection options', () => {
      it('should parse ssl', (done) => {
        Connection.from(
          'mongodb://db0.example.com,db1.example.com,db2.example.com/?replicaSet=myReplOther&ssl=true',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.replicaSet).to.be.equal('myReplOther');
            expect(result.ssl).to.be.equal(true);
            done();
          }
        );
      });

      it('should parse connectTimeoutMS', (done) => {
        Connection.from(
          'mongodb://mongodb1.example.com:27317,mongodb2.example.com:27017/?connectTimeoutMS=300000&replicaSet=mySet&authSource=aDifferentAuthDB',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.connectTimeoutMS).to.be.equal(300000);
            done();
          }
        );
      });

      it('should parse socketTimeoutMS with w', (done) => {
        Connection.from(
          'mongodb://localhost:27017/sampleDb?socketTimeoutMS=30000&w=majority',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.socketTimeoutMS).to.be.equal(30000);
            done();
          }
        );
      });

      it('should parse socketTimeoutMS with multiple servers', (done) => {
        Connection.from(
          'mongodb://localhost:27017,localhost:27018,localhost:27019/sampleDb?replicaSet=rs0&socketTimeoutMS=5000',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.socketTimeoutMS).to.be.equal(5000);
            done();
          }
        );
      });

      it('should parse compressors with snappy value', (done) => {
        Connection.from(
          'mongodb://localhost/?compressors=snappy',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result).to.have.property('compression');
            expect(result.compression.compressors).to.have.lengthOf(1);
            expect(result.compression.compressors).to.include('snappy');
            done();
          }
        );
      });

      it('should parse compressors with zlib value', (done) => {
        Connection.from(
          'mongodb://localhost/?compressors=zlib',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result).to.have.property('compression');
            expect(result.compression.compressors).to.have.lengthOf(1);
            expect(result.compression.compressors).to.include('zlib');
            done();
          }
        );
      });

      it('should throw the error if compressors contain invalid value', (done) => {
        Connection.from('mongodb://localhost/?compressors=bunnies', (error) => {
          expect(error).to.exist;
          done();
        });
      });

      it('should parse compressors with snappy and zlib values', (done) => {
        Connection.from(
          'mongodb://localhost/?compressors=snappy,zlib',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result).to.have.property('compression');
            expect(result.compression.compressors).to.have.lengthOf(2);
            expect(result.compression.compressors).to.include('zlib');
            expect(result.compression.compressors).to.include('snappy');
            done();
          }
        );
      });

      it('should parse zlibCompressionLevel', (done) => {
        Connection.from(
          'mongodb://localhost/?compressors=zlib&zlibCompressionLevel=4',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result).to.have.property('compression');
            expect(result.compression).to.eql({
              compressors: ['zlib'],
              zlibCompressionLevel: 4
            });
            done();
          }
        );
      });

      it('should throw the error if zlibCompressionLevel has invalid value', (done) => {
        Connection.from(
          'mongodb://localhost/?zlibCompressionLevel=15',
          (error) => {
            expect(error).to.exist;
            done();
          }
        );
      });
    });

    describe('connection pool options', () => {
      it('should parse minPoolSize and maxPoolSize', (done) => {
        Connection.from(
          'mongodb://localhost:27017,localhost:27018,localhost:27019/databasename?replicaSet=rs01&ssl=false&connectTimeoutMS=100000&minPoolSize=5&maxPoolSize=10',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.minPoolSize).to.be.equal(5);
            expect(result.maxPoolSize).to.be.equal(10);
            done();
          }
        );
      });

      it('should parse maxIdleTimeMS', (done) => {
        Connection.from(
          'mongodb://localhost/test?maxIdleTimeMS=30000',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.maxIdleTimeMS).to.be.equal(30000);
            done();
          }
        );
      });

      it('should parse waitQueueMultiple', (done) => {
        Connection.from(
          'mongodb://user:password@ip:27017/?waitQueueMultiple=10',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.waitQueueMultiple).to.be.equal(10);
            done();
          }
        );
      });

      it('should parse escaped URI with maxIdleTimeMS, waitQueueTimeoutMS, waitQueueTimeoutMS and journal', (done) => {
        Connection.from(
          'mongodb://localhost/test?readPreference=primary&amp;maxPoolSize=50&amp;minPoolSize=5&amp;maxIdleTimeMS=1000&amp;waitQueueMultiple=200&amp;waitQueueTimeoutMS=100&amp;w=1&amp;journal=true',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.journal).to.be.equal(true);
            expect(result.maxIdleTimeMS).to.be.equal(1000);
            expect(result.waitQueueMultiple).to.be.equal(200);
            expect(result.waitQueueTimeoutMS).to.be.equal(100);
            done();
          }
        );
      });
    });

    describe('write concern options', () => {
      it('should parse write concern w option with number value', (done) => {
        Connection.from(
          'mongodb://localhost/DBName?replicaSet=xxxx&w=1&readPreference=nearest&maxPoolSize=50',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.w).to.be.equal(1);
            done();
          }
        );
      });

      it('should parse write concern w option with majority value', (done) => {
        Connection.from(
          'mongodb://localhost/DBName?replicaSet=xxxx&w=majority',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.w).to.be.equal('majority');
            done();
          }
        );
      });

      it('should parse write concern w option with tag set value', (done) => {
        Connection.from(
          'mongodb://localhost/DBName?w=MultipleDC',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.w).to.be.equal('MultipleDC');
            done();
          }
        );
      });

      it('should parse wTimeoutMS', (done) => {
        Connection.from(
          'mongodb://host1:port1,host2:port2/?ssl=1&wtimeoutMS=1000', // Note the difference `wtimeoutMS` and `wTimeoutMS`
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.wTimeoutMS).to.be.equal(1000); // Returned value was camelCased
            done();
          }
        );
      });

      it('should parse journal', (done) => {
        Connection.from(
          'mongodb://localhost/test?readPreference=primary&w=1&journal=true',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.journal).to.be.equal(true);
            done();
          }
        );
      });

      it('should parse j option', (done) => {
        Connection.from(
          'mongodb://localhost/test?readPreference=primary&w=1&j=true',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.journal).to.be.equal(true); // Converts j=true to journal=true
            done();
          }
        );
      });

      it('should parse wtimeout', (done) => {
        Connection.from(
          'mongodb://localhost/test?w=1&wtimeout=2500',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.wTimeoutMS).to.be.equal(2500); // Converts jwtimeout to wTimeoutMS
            done();
          }
        );
      });
    });

    describe('read concern options', () => {
      it('should parse readConcernLevel with local value', (done) => {
        Connection.from(
          'mongodb://localhost/?readConcernLevel=local',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.readConcernLevel).to.be.equal('local');
            done();
          }
        );
      });

      it('should parse readConcernLevel with majority value', (done) => {
        Connection.from(
          'mongodb://db0.example.com,db1.example.com,db2.example.com/?replicaSet=myRepl&readConcernLevel=majority',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.readConcernLevel).to.be.equal('majority');
            done();
          }
        );
      });
    });

    describe('read preference options', () => {
      it('should parse readPreference and maxStalenessSeconds', (done) => {
        Connection.from(
          'mongodb://mongos1.example.com,mongos2.example.com/?readPreference=secondary&maxStalenessSeconds=120',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.readPreference).to.be.equal('secondary');
            expect(result.maxStalenessSeconds).to.be.equal(120);
            done();
          }
        );
      });

      it('should throw the error if readPreference has invalid value', (done) => {
        Connection.from(
          'mongodb://localhost/?readPreference=llamasPreferred',
          (error) => {
            expect(error).to.exist;
            done();
          }
        );
      });

      it('should parse readPreference and readPreferenceTags', (done) => {
        Connection.from(
          'mongodb://mongos1.example.com,mongos2.example.com/?readPreference=secondary&readPreferenceTags=dc:ny,rack:1',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.readPreference).to.be.equal('secondary');
            expect(result).to.have.property('readPreferenceTags');
            expect(result.readPreferenceTags).to.eql([{ dc: 'ny', rack: 1 }]);
            done();
          }
        );
      });
    });

    describe('authentication options', () => {
      it('should parse authSource', (done) => {
        Connection.from(
          'mongodb://myDBReader:D1fficultP%40ssw0rd@mongodb0.example.com:27017,mongodb1.example.com:27017,mongodb2.example.com:27017/test?replicaSet=myRepl&authSource=admin',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result).to.have.property('authSource');
            expect(result.authSource).to.equal('admin');
            done();
          }
        );
      });

      it('should parse authSource and authMechanism', (done) => {
        Connection.from(
          'mongodb://user:password@example.com/?authSource=theDatabase&authMechanism=SCRAM-SHA-256',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.authSource).to.be.equal('theDatabase');
            expect(result.authMechanism).to.be.equal('SCRAM-SHA-256');
            done();
          }
        );
      });

      it('should throw the error if authMechanism has invalid value', (done) => {
        Connection.from('mongodb://localhost/?authMechanism=DOGS', (error) => {
          expect(error).to.exist;
          done();
        });
      });

      it('should parse authMechanismProperties', (done) => {
        Connection.from(
          'mongodb://user%40EXAMPLE.COM:secret@localhost/?authMechanismProperties=SERVICE_NAME:other,SERVICE_REALM:blah,CANONICALIZE_HOST_NAME:true&authMechanism=GSSAPI',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result).to.deep.include({
              gssapiServiceName: 'other',
              gssapiServiceRealm: 'blah',
              gssapiCanonicalizeHostName: true
            });
            expect(result).to.have.property('authMechanism');
            expect(result.authMechanism).to.equal('GSSAPI');
            done();
          }
        );
      });

      it('should parse authMechanismProperties', (done) => {
        Connection.from(
          'mongodb://user:password@example.com/?authMechanism=GSSAPI&authSource=$external&gssapiServiceName=mongodb',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.gssapiServiceName).to.be.equal('mongodb');
            done();
          }
        );
      });
    });

    describe('server selection and discovery options', () => {
      it('should parse multiple options including localThresholdMS, serverSelectionTimeoutMS and heartbeatFrequencyMS', (done) => {
        Connection.from(
          'mongodb://localhost/?replicaSet=test&w=1&ssl=true&readPreference=secondary&serverSelectionTimeoutMS=25000&localThresholdMS=30&heartbeatFrequencyMS=20000',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.localThresholdMS).to.be.equal(30);
            expect(result.serverSelectionTimeoutMS).to.be.equal(25000);
            expect(result.heartbeatFrequencyMS).to.be.equal(20000);
            done();
          }
        );
      });

      it('should parse serverSelectionTryOnce', (done) => {
        Connection.from(
          'mongodb://a/?serverSelectionTryOnce=false',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.serverSelectionTryOnce).to.be.equal(false);
            done();
          }
        );
      });
    });

    describe('miscellaneous configuration', () => {
      it('should parse appname', (done) => {
        Connection.from('mongodb://localhost/?appname=foo', (error, result) => {
          expect(error).to.not.exist;
          expect(result.appname).to.be.equal('foo');
          done();
        });
      });

      it('should parse retryWrites with invalid value eql 1', (done) => {
        Connection.from('mongodb://hostname?retryWrites=1', (error, result) => {
          expect(error).to.not.exist;
          expect(result.retryWrites).to.be.equal(false); // retryWrites expects a bool value. Other values are being treated as false
          done();
        });
      });

      it('should parse retryWrites with invalid value eql 3', (done) => {
        Connection.from('mongodb://hostname?retryWrites=1', (error, result) => {
          expect(error).to.not.exist;
          expect(result.retryWrites).to.be.equal(false);
          done();
        });
      });

      it('should parse retryWrites with false value', (done) => {
        Connection.from(
          'mongodb://hostname?retryWrites=false',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.retryWrites).to.be.equal(false);
            done();
          }
        );
      });

      it('should parse retryWrites with true value', (done) => {
        Connection.from(
          'mongodb://hostname?retryWrites=true',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.retryWrites).to.be.equal(true);
            done();
          }
        );
      });

      it('should parse uuidRepresentation', (done) => {
        Connection.from(
          'mongodb://foo/?uuidrepresentation=csharpLegacy',
          (error, result) => {
            expect(error).to.not.exist;
            expect(result.uuidRepresentation).to.be.equal('csharpLegacy');
            done();
          }
        );
      });
    });
  });
});
