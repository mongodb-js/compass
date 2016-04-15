'use strict';

const SpectronSupport = require('mongodb-test-utils').SpectronSupport;
const path = require('path');
const dist = path.join(__dirname, '..', 'dist');

describe('Connect Window #spectron', function() {
  this.slow(10000);
  this.timeout(30000);
  var app = null;

  before(function(done) {
    SpectronSupport.startApplication(dist).then(function(application) {
      app = application;
      done();
    });
  });

  after(function(done) {
    SpectronSupport.stopApplication(app).then(done);
  });

  describe('when opening the window', function() {
    it('renders the connect window', function() {
      return app.client
        .getWindowCount().should.eventually.equal(1)
        .isWindowMinimized().should.eventually.be.false
        .isWindowDevToolsOpened().should.eventually.be.false
        .isWindowVisible().should.eventually.be.true
        .isWindowFocused().should.eventually.be.true
        .getWindowWidth().should.eventually.be.above(0)
        .getWindowHeight().should.eventually.be.above(0)
        .getTitle().should.eventually.be.equal('MongoDB Compass - Connect');
    });
  });

  describe('when connecting with no authentication', function() {
    before(require('mongodb-runner/mocha/before')({
      port: 27018
    }));

    after(require('mongodb-runner/mocha/after')());

    describe('when the server does not exist', function() {
      it('displays an error message', function() {
        return app.client
          .waitForVisible('select[name=authentication]')
          .fillOutForm({ hostname: 'localhost', port: 55555 })
          .clickConnect()
          .waitForVisible('.form-container .message.error')
          .getText('.form-container .message.error')
          .should.eventually.be.equal('connect ECONNREFUSED 127.0.0.1:55555');
      });
    });

    describe('when the server exists', function() {
      it('opens the schema window', function() {
        return app.client
          .fillOutForm({ hostname: 'localhost', port: 27018 })
          .clickConnect()
          .waitForSchemaWindow()
          .getTitle().should.eventually.be.equal('MongoDB Compass');
      });
    });
  });

  describe('when connecting with authentication', function() {
    describe('when connecting with user and password', function() {
      describe('when the credentials are correct', function() {
        it('opens the schema window');
      });

      describe('when the credentials are incorrect', function() {
        it('displays an error message');
      });
    });

    describe('when connecting with LDAP', function() {
      describe('when the credentials are correct', function() {
        it('opens the schema window');
      });

      describe('when the credentials are incorrect', function() {
        it('displays an error message');
      });
    });

    describe('when connecting with Kerberos', function() {
      describe('when the credentials are correct', function() {
        it('opens the schema window');
      });

      describe('when the credentials are incorrect', function() {
        it('displays an error message');
      });
    });

    describe('when connecting with a recent connection', function() {
      it('opens the schema window');
    });
  });
});
