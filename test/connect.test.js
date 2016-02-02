var helpers = require('./helpers');

if (process.env.EVERGREEN) {
  helpers.warnEvergreen();
} else {
  describe('Connect Window', function() {
    this.slow(10000);
    this.timeout(30000);

    beforeEach(helpers.startApplication);
    afterEach(helpers.stopApplication);

    context('when opening the window', function() {
      it('renders the connect window', function() {
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
    });

    context('when connecting with no authentication', function() {
      context('when the server exists', function() {
        it('opens the schema window');
      });

      context('when the server does not exist', function() {
        it('displays an error message', function() {
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
      });
    });

    context('when connecting with authentication', function() {
      context('when connecting with user and password', function() {
        context('when the credentials are correct', function() {
          it('opens the schema window');
        });

        context('when the credentials are incorrect', function() {
          it('displays an error message');
        });
      });

      context('when connecting with LDAP', function() {
        context('when the credentials are correct', function() {
          it('opens the schema window');
        });

        context('when the credentials are incorrect', function() {
          it('displays an error message');
        });
      });

      context('when connecting with Kerberos', function() {
        context('when the credentials are correct', function() {
          it('opens the schema window');
        });

        context('when the credentials are incorrect', function() {
          it('displays an error message');
        });
      });

      context('when connecting with a recent connection', function() {
        it('opens the schema window');
      });
    });
  });
}
