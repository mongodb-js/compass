const Connection = require('../');
const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-subset'));

describe('connection model parser should parse URI strings for common connection targets such as', () => {
  context('ATLAS - mongodb.net when a database is provided', () => {
    const atlasConnection =
      'mongodb://ADMINUSER:<PASSWORD>@' +
      'a-compass-atlas-test-shard-00-00-vll9l.mongodb.net:38128,' +
      'a-compass-atlas-test-shard-00-01-vll9l.mongodb.net:38128,' +
      'a-compass-atlas-test-shard-00-02-vll9l.mongodb.net:38128/<DATABASE>?' +
      'ssl=true&replicaSet=a-compass-atlas-test-shard-0&authSource=admin&readPreference=secondary';
    const okAtlasPassword = 'A_MUCH_LONGER_PASSWORD_should_be_more secure...';
    const okAtlasPasswordConnection = atlasConnection.replace(
      '<PASSWORD>',
      okAtlasPassword
    );

    it('sets replicaSet, readPreference, ssl, ns, authSource and clears the default password', (done) => {
      Connection.from(atlasConnection, (error, result) => {
        expect(error).to.not.exist;
        expect(result.replicaSet).to.be.equal('a-compass-atlas-test-shard-0');
        expect(result.readPreference).to.be.equal('secondary');
        expect(result.sslMethod).to.be.equal('SYSTEMCA');
        expect(result.mongodbPassword).to.be.equal('');
        expect(result.ns).to.be.equal('admin');
        expect(result.driverUrl).to.include('authSource=admin');
        done();
      });
    });

    it('does not clear sufficiently long passwords that happen to contain PASSWORD', (done) => {
      Connection.from(okAtlasPasswordConnection, (error, result) => {
        expect(error).to.not.exist;
        expect(result.mongodbPassword).to.be.equal(okAtlasPassword);
        done();
      });
    });

    it('works with a non-default secure password', (done) => {
      const userPass = '6NuZPtHCrjYBAWnI7Iq6jvtsdJx67X0';
      const modifiedAtlasConnection = atlasConnection.replace(
        '<PASSWORD>',
        userPass
      );

      Connection.from(modifiedAtlasConnection, (error, result) => {
        expect(error).to.not.exist;
        expect(result.sslMethod).to.be.equal('SYSTEMCA');
        expect(result.mongodbPassword).to.be.equal(userPass);
        done();
      });
    });

    it('does not false positive on hi.mongodb.net.my.domain.com', (done) => {
      const modifiedAtlasConnection = atlasConnection.replace(
        /mongodb.net/g,
        'hi.mongodb.net.my.domain.com'
      );

      Connection.from(modifiedAtlasConnection, (error, result) => {
        expect(error).to.not.exist;
        expect(result.sslMethod).to.be.equal('NONE');
        done();
      });
    });

    it('is case insensitive, see RFC4343', (done) => {
      const modifiedAtlasConnection = atlasConnection.replace(
        /mongodb.net/g,
        'mOnGOdB.NeT'
      );

      Connection.from(modifiedAtlasConnection, (error, result) => {
        expect(error).to.not.exist;
        expect(result.sslMethod).to.be.equal('SYSTEMCA');
        done();
      });
    });
  });

  context('ATLAS - mongodb.net when a database is not provided', () => {
    const atlasConnection =
      'mongodb://ADMINUSER:<PASSWORD>@' +
      'a-compass-atlas-test-shard-00-00-vll9l.mongodb.net:38128,' +
      'a-compass-atlas-test-shard-00-01-vll9l.mongodb.net:38128,' +
      'a-compass-atlas-test-shard-00-02-vll9l.mongodb.net:38128';

    it('sets hostname, port, ns, authSource', (done) => {
      Connection.from(atlasConnection, (error, result) => {
        expect(error).to.not.exist;
        expect(result.hostname).to.be.equal(
          'a-compass-atlas-test-shard-00-00-vll9l.mongodb.net'
        );
        expect(result.port).to.be.equal(38128);
        expect(result.ns).to.be.equal('test');
        expect(result.driverUrl).to.include('authSource=admin');
        done();
      });
    });
  });

  context('localhost', () => {
    it('database server running locally', (done) => {
      Connection.from('mongodb://localhost', (error, result) => {
        expect(error).to.not.exist;
        expect(result.hostname).to.be.equal('localhost');
        expect(result.port).to.be.equal(27017);
        done();
      });
    });

    it('admin database', (done) => {
      Connection.from('mongodb://sysop:moon@localhost', (error, result) => {
        expect(error).to.not.exist;
        expect(result.mongodbUsername).to.be.equal('sysop');
        expect(result.mongodbPassword).to.be.equal('moon');
        done();
      });
    });

    it('records database', (done) => {
      Connection.from(
        'mongodb://sysop:moon@localhost/records',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.mongodbUsername).to.be.equal('sysop');
          expect(result.mongodbPassword).to.be.equal('moon');
          expect(result.ns).to.be.equal('records');
          done();
        }
      );
    });

    it('replica set with members on localhost', (done) => {
      Connection.from(
        'mongodb://localhost,localhost:27018,localhost:27019/?replicaSet=test',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.replicaSet).to.be.equal('test');
          expect(result).to.have.property('hosts');
          expect(result.hosts).to.have.lengthOf(3);
          expect(result.hosts[0]).to.be.deep.equal({
            host: 'localhost',
            port: 27017
          });
          expect(result.hosts[1]).to.be.deep.equal({
            host: 'localhost',
            port: 27018
          });
          expect(result.hosts[2]).to.be.deep.equal({
            host: 'localhost',
            port: 27019
          });
          done();
        }
      );
    });

    it('with explicit authSource', (done) => {
      Connection.from(
        'mongodb://%40rlo:w%40of@localhost:27017/dogdb?authMechanism=SCRAM-SHA-1&authSource=catdb',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.ns).to.be.equal('dogdb');
          expect(result.mongodbDatabaseName).to.be.equal('catdb');
          done();
        }
      );
    });

    it('when authSource is not specified should fall back to dbName', (done) => {
      Connection.from(
        'mongodb://%40rlo:w%40of@localhost:27017/dogdb?authMechanism=SCRAM-SHA-1',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.ns).to.be.equal('dogdb');
          expect(result.mongodbDatabaseName).to.be.equal('admin');
          done();
        }
      );
    });

    it('when using MONGODB auth', (done) => {
      Connection.from(
        'mongodb://%40rlo:w%40of@localhost:27017/?authSource=%40dmin',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.hostname).to.be.equal('localhost');
          expect(result.port).to.be.equal(27017);
          expect(result.authStrategy).to.be.equal('MONGODB');
          expect(result.mongodbUsername).to.be.equal('@rlo');
          expect(result.mongodbPassword).to.be.equal('w@of');
          expect(result.mongodbDatabaseName).to.be.equal('@dmin'); // this is the authSource, not dbName!
          done();
        }
      );
    });

    it('when using LDAP auth', (done) => {
      Connection.from(
        'mongodb://arlo:w%40of@localhost:27017/ldap?authMechanism=PLAIN',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.hostname).to.be.equal('localhost');
          expect(result.port).to.be.equal(27017);
          expect(result.authStrategy).to.be.equal('LDAP');
          expect(result.ldapUsername).to.be.equal('arlo');
          expect(result.ldapPassword).to.be.equal('w@of');
          expect(result.ns).to.be.equal('ldap');
          done();
        }
      );
    });

    it('when using X509 auth with a username', (done) => {
      Connection.from(
        'mongodb://CN%253Dclient%252COU%253Darlo%252CO%253DMongoDB%252CL%253DPhiladelphia' +
        '%252CST%253DPennsylvania%252CC%253DUS@localhost:27017/' +
        'x509?authMechanism=MONGODB-X509',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.hostname).to.be.equal('localhost');
          expect(result.port).to.be.equal(27017);
          expect(result.authStrategy).to.be.equal('X509');
          expect(result.x509Username).to.be.equal(
            'CN=client,OU=arlo,O=MongoDB,L=Philadelphia,ST=Pennsylvania,C=US'
          );
          expect(result.ns).to.be.equal('x509');
          done();
        }
      );
    });

    it('when using X509 auth without a username', (done) => {
      Connection.from(
        'mongodb://localhost:27017/x509?authMechanism=MONGODB-X509',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.hostname).to.be.equal('localhost');
          expect(result.port).to.be.equal(27017);
          expect(result.authStrategy).to.be.equal('X509');
          expect(result.x509Username).to.be.equal(undefined);
          expect(result.ns).to.be.equal('x509');
          done();
        }
      );
    });

    it('when using KERBEROS auth', (done) => {
      Connection.from(
        'mongodb://arlo%252Fdog%2540krb5.mongodb.parts:w%40%40f@localhost:27017/' +
        'kerberos?gssapiServiceName=mongodb&authMechanism=GSSAPI',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.hostname).to.be.equal('localhost');
          expect(result.port).to.be.equal(27017);
          expect(result.authStrategy).to.be.equal('KERBEROS');
          expect(result.kerberosPrincipal).to.be.equal(
            'arlo/dog@krb5.mongodb.parts'
          );
          expect(result.kerberosPassword).to.be.equal('w@@f');
          expect(result.ns).to.be.equal('kerberos');
          done();
        }
      );
    });
  });

  context('remote host', () => {
    it('UNIX domain socket', (done) => {
      Connection.from(
        'mongodb://%2Ftmp%2Fmongodb-27017.sock',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.hostname).to.be.equal('/tmp/mongodb-27017.sock');
          expect(result.port).to.be.equal(27017);
          done();
        }
      );
    });

    it('replica set with members on different machines', (done) => {
      Connection.from(
        'mongodb://db1.example.net,db2.example.com/?replicaSet=test',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.replicaSet).to.be.equal('test');
          expect(result).to.have.property('hosts');
          expect(result.hosts).to.have.lengthOf(2);
          expect(result.hosts[0]).to.be.deep.equal({
            host: 'db1.example.net',
            port: 27017
          });
          expect(result.hosts[1]).to.be.deep.equal({
            host: 'db2.example.com',
            port: 27017
          });
          done();
        }
      );
    });

    it('replica set with read distribution', (done) => {
      Connection.from(
        'mongodb://example1.com,example2.com,example3.com/?replicaSet=test&readPreference=secondary',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.replicaSet).to.be.equal('test');
          expect(result.readPreference).to.be.equal('secondary');
          expect(result).to.have.property('hosts');
          expect(result.hosts).to.have.lengthOf(3);
          expect(result.hosts[0]).to.be.deep.equal({
            host: 'example1.com',
            port: 27017
          });
          expect(result.hosts[1]).to.be.deep.equal({
            host: 'example2.com',
            port: 27017
          });
          expect(result.hosts[2]).to.be.deep.equal({
            host: 'example3.com',
            port: 27017
          });
          done();
        }
      );
    });

    it('replica set with a high level of write concern', (done) => {
      Connection.from(
        'mongodb://example1.com,example2.com,example3.com/?replicaSet=test&w=2&wtimeoutMS=2000',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result.replicaSet).to.be.equal('test');
          expect(result.w).to.be.equal(2);
          expect(result.wTimeoutMS).to.be.equal(2000);
          expect(result).to.have.property('hosts');
          expect(result.hosts).to.have.lengthOf(3);
          expect(result.hosts[0]).to.be.deep.equal({
            host: 'example1.com',
            port: 27017
          });
          expect(result.hosts[1]).to.be.deep.equal({
            host: 'example2.com',
            port: 27017
          });
          expect(result.hosts[2]).to.be.deep.equal({
            host: 'example3.com',
            port: 27017
          });
          done();
        }
      );
    });

    it('sharded cluster', (done) => {
      Connection.from(
        'mongodb://router1.example.com:27017,router2.example2.com:27017,router3.example3.com:27017/',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result).to.have.property('hosts');
          expect(result.hosts).to.have.lengthOf(3);
          expect(result.hosts[0]).to.be.deep.equal({
            host: 'router1.example.com',
            port: 27017
          });
          expect(result.hosts[1]).to.be.deep.equal({
            host: 'router2.example2.com',
            port: 27017
          });
          expect(result.hosts[2]).to.be.deep.equal({
            host: 'router3.example3.com',
            port: 27017
          });
          done();
        }
      );
    });

    it('sharded cluster and admin database', (done) => {
      Connection.from(
        'mongodb://mongos0.example.com:27017,mongos1.example.com:27017,mongos2.example.com:27017/admin',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result).to.have.property('hosts');
          expect(result.hosts).to.have.lengthOf(3);
          expect(result.hosts[0]).to.be.deep.equal({
            host: 'mongos0.example.com',
            port: 27017
          });
          expect(result.hosts[1]).to.be.deep.equal({
            host: 'mongos1.example.com',
            port: 27017
          });
          expect(result.hosts[2]).to.be.deep.equal({
            host: 'mongos2.example.com',
            port: 27017
          });
          expect(result.ns).to.be.equal('admin');
          done();
        }
      );
    });

    it('sharded cluster that enforces access control, include user credentials', (done) => {
      Connection.from(
        'mongodb://myDBReader:D1fficultP%40ssw0rd@mongos0.example.com:27017,mongos1.example.com:27017,mongos2.example.com:27017/admin',
        (error, result) => {
          expect(error).to.not.exist;
          expect(result).to.have.property('hosts');
          expect(result.hosts).to.have.lengthOf(3);
          expect(result.hosts[0]).to.be.deep.equal({
            host: 'mongos0.example.com',
            port: 27017
          });
          expect(result.hosts[1]).to.be.deep.equal({
            host: 'mongos1.example.com',
            port: 27017
          });
          expect(result.hosts[2]).to.be.deep.equal({
            host: 'mongos2.example.com',
            port: 27017
          });
          expect(result.mongodbUsername).to.be.equal('myDBReader');
          expect(result.mongodbPassword).to.be.equal('D1fficultP@ssw0rd');
          expect(result.ns).to.be.equal('admin');
          expect(result.authStrategy).to.be.equal('MONGODB');
          done();
        }
      );
    });

    it('when host and port are specified', (done) => {
      Connection.from('mongodb://krb5.mongodb.parts:1234', (error, result) => {
        expect(error).to.not.exist;
        expect(result.hostname).to.be.equal('krb5.mongodb.parts');
        expect(result.port).to.be.equal(1234);
        done();
      });
    });

    it('when port is not specified', (done) => {
      Connection.from('mongodb://data.mongodb.com/', (error, result) => {
        expect(error).to.not.exist;
        expect(result.hostname).to.be.equal('data.mongodb.com');
        expect(result.port).to.be.equal(27017);
        done();
      });
    });
  });
});
