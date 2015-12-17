var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var helpers = require('./helpers');
var Application = require('spectron').Application;

// var debug = require('debug')('scout:test:example');
chai.use(chaiAsPromised);

if (process.env.EVERGREEN) {
  /* eslint no-console:0 */
  console.warn('Spectron acceptance tests skipped on '
   + 'evergreen until the following is resolved: '
   + 'https://jira.mongodb.org/browse/BUILD-1122');
} else {
  describe('Application', function() {
    this.slow(10000);
    this.timeout(30000);

    beforeEach(function() {
      this.app = new Application({
        path: helpers.getElectronPath()
      });
      return this.app.start();
    });

    beforeEach(function() {
      chaiAsPromised.transferPromiseness = this.app.client.transferPromiseness;
      chai.should().exist(this.app.client);
      return this.app.client.waitUntilWindowLoaded();
    });

    beforeEach(function() {
      helpers.addCommands(this.app.client);
    });

    afterEach(helpers.stopApplication);

    describe('Connect Window', function() {
      it('should open correctly', function() {
        return this.app.client
          .getWindowCount().should.eventually.equal(1)
          .isWindowMinimized().should.eventually.be.false
          .isWindowDevToolsOpened().should.eventually.be.false
          .isWindowVisible().should.eventually.be.true
          .isWindowFocused().should.eventually.be.true
          .getWindowWidth().should.eventually.be.above(0)
          .getWindowHeight().should.eventually.be.above(0)
          .getTitle().should.eventually.be.equal('MongoDB Compass - Connect');
      });

      it('should correctly fill in authentication fields', function() {
        return this.app.client
          .waitForVisible('select[name=authentication]')
          .fillOutForm({
            authentication: 'MONGODB',
            mongodb_username: '@rlo',
            mongodb_password: 'dogfood'
          })
          .getValue('select[name=authentication]').should.eventually.equal('MONGODB')
          .getValue('input[name=mongodb_username]').should.eventually.equal('@rlo')
          .getValue('input[name=mongodb_password]').should.eventually.equal('dogfood')

          .fillOutForm({
            authentication: 'KERBEROS',
            kerberos_principal: 'leafy@PRINCIPAL',
            kerberos_password: 'greeny'
          })
          .getValue('select[name=authentication]').should.eventually.equal('KERBEROS')
          .getValue('input[name=kerberos_principal]').should.eventually.equal('leafy@PRINCIPAL')
          .getValue('input[name=kerberos_password]').should.eventually.equal('greeny')

          .fillOutForm({
            authentication: 'LDAP',
            ldap_username: 'my_ldap_name',
            ldap_password: 'foobar'
          })
          .getValue('select[name=authentication]').should.eventually.equal('LDAP')
          .getValue('input[name=ldap_username]').should.eventually.equal('my_ldap_name')
          .getValue('input[name=ldap_password]').should.eventually.equal('foobar');
      });

      it('should show an error message when MongoDB is not running', function() {
        return this.app.client
          .waitForVisible('select[name=authentication]')
          .fillOutForm({
            hostname: 'localhost',
            port: 55555
          })
          .clickConnect()
          .waitForVisible('.form-container .message.error')
          .getText('.form-container .message.error').should.eventually.be.equal('MongoDB not running');
      });

      /**
       * Start a local mongod and test if Compass can connect to it
       */
      describe.skip('connecting to a local MongoDB', function() {
        // start a mongod on localhost:27017
        before(require('mongodb-runner/mocha/before')());
        after(require('mongodb-runner/mocha/after')());

        it('should fill out the form, connect and open schema window', function() {
          return this.app.client
            .waitUntilWindowLoaded()
            .gotoSchemaWindow()
            .getTitle().should.eventually.be.equal('MongoDB')
            .getWindowHeight().should.eventually.be.at.least(740);
        });
      });

      /**
       * Connect to standalone.compass-test-1.mongodb.parts with the compass
       * user.
       */
      describe('connecting to compass-test-1 standalone server', function() {
        beforeEach(function() {
          if (!process.env.MONGODB_PASSWORD_COMPASS) {
            this.skip();
            return null;
          }
          var connection = {
            hostname: 'standalone.compass-test-1.mongodb.parts',
            port: 27000,
            authentication: 'MONGODB',
            mongodb_username: 'compass',
            mongodb_password: process.env.MONGODB_PASSWORD_COMPASS,
            mongodb_database_name: 'admin'
          };
          return this.app.client.gotoSchemaWindow(connection);
        });

        after(function() {
          // have to stop manually because the outer afterEach is not called
          // when this.skip() was executed in the beforeEach hook. I think this
          // is a mocha bug.
          if (!process.env.MONGODB_PASSWORD_COMPASS) {
            return this.app.stop();
          }
        });

        it('should get a schema window on the remote server', function() {
          return this.app.client
            .getTitle().should.eventually.be.equal('MongoDB Compass');
        });
      });
    });


    describe.skip('Schema Window', function() {
      /**
       * Start a local mongod and test if Compass can connect to it
       */
      describe('connecting to a local MongoDB', function() {
        // start a mongod on localhost:27017
        before(require('mongodb-runner/mocha/before')());
        after(require('mongodb-runner/mocha/after')());

        it('should show the modal tour on first launch', function() {
          return this.app.client
            .localStorage('DELETE', 'lastKnownVersion')
            .gotoSchemaWindow()
            .waitForVisible('#tour-bg')
            .isVisible('#tour-bg').should.eventually.be.true;
        });

        it('should not show the modal tour when lastKnownVersion is set', function() {
          return this.app.client
            .gotoSchemaWindow()
            .waitForExist('.column.main')
            .isVisible('#tour-bg').should.eventually.be.false;
        });

        it('should sample a collection', function() {
          return this.app.client
          .gotoSchemaWindow()
          // wait until collection is sampled and ready
          .sampleCollection('local.startup_log', true)
          // make sure title is correct
          .getText('header h1').should.eventually.be.equal('local.startup_log')
          // sampling message should be displayed
          .getText('.sampling-message').should.eventually.match(/^Query returned [\d,]+ document(s)?/)
          // assert schema field rows are present
          .elements('.column.main > .schema-field-list > .schema-field')
          .then(helpers.responseValue).then(function(el) {
            return el.length.should.be.above(5);
          });
        });
      });
    });
  });
}
