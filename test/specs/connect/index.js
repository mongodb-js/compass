var assert = require('assert');

describe('Connect', function() {
  beforeEach(function() {
    browser.execute('location.reload()');
  });

  it('should have the correct title', function* () {
    var title = yield browser.getTitle();
    assert.equal(title, 'Connect to MongoDB');
  });

  // increase timeout since next test exceeds current timeout
  var prevTimeout = this.timeout();
  this.timeout(40000);

  it('should connect with various authentication and ssl', function*() {

    var auths = [setNoAuth, setMongoDBAuth, setKerbAuth];
    var ssls = [setNoSSL, setUnvalidSSL, setServerSSL, setServerAndClientSSL];

    for (authIndex = 0; authIndex < auths.length; authIndex++) {
      for (sslIndex = 0; sslIndex < ssls.length; sslIndex++) {
        yield browser.execute('location.reload()');
        yield fillForm({
          hostname: 'localhost',
          port: 27017
        });
        yield auths[authIndex]();
        yield ssls[sslIndex]();
        submitForm();
      }
    }
  });

  this.timeout(prevTimeout);

  it('should fail to connect to localhost:27017', function* (){
    yield fillForm({
      hostname: 'localhost',
      port: 27017
    });
    yield setNoAuth();
    yield submitForm();
    yield browser.waitForExist('.message.error', 1000);
  });
});

// form methods
function* fillForm(model) {
  if (model.hostname)
    yield browser.setValue('[name=hostname]', model.hostname);
  if (model.port)
    yield browser.setValue('[name=port]', model.port);
  if (model.name)
    yield browser.setValue('[name=name]', model.name);
}

function* submitForm() {
  yield browser.execute('$(\'[name=connect]\').click()');
}

// set auth methods
function* setNoAuth() {
  yield browser.selectByValue('[name=authentication]', 'NONE');
}

function* setMongoDBAuth(username, password, database) {
  username = (typeof username !== 'undefined') ? username : 'username';
  password = (typeof password !== 'undefined') ? password : 'password';
  database = (typeof database !== 'undefined') ? database : 'database';

  yield browser.selectByValue('[name=authentication]', 'MONGODB');
  yield browser.setValue('[name=mongodb_username]', username);
  yield browser.setValue('[name=mongodb_password]', password);
  yield browser.setValue('[name=mongodb_database_name]', database);
}

function* setKerbAuth(serviceName, principal, password) {
  serviceName = (typeof serviceName !== 'undefined') ? serviceName : 'serviceName';
  principal = (typeof principal !== 'undefined') ? principal : 'principal';
  password = (typeof password !== 'undefined') ? password : 'password';

  yield browser.selectByValue('[name=authentication]', 'KERBEROS');
  yield browser.setValue('[name=kerberos_service_name]', serviceName);
  yield browser.setValue('[name=kerberos_principal]', principal);
  yield browser.setValue('[name=kerberos_password]', password);
}

// set SSL methods
function* setNoSSL() {
  yield browser.selectByValue('[name=ssl]', 'NONE')
}

function* setUnvalidSSL() {
  yield browser.selectByValue('[name=ssl]', 'UNVALIDATED');
}

function* setServerSSL(certAuthFile) {
  yield browser.selectByValue('[name=ssl]', 'SERVER');
}

function* setServerAndClientSSL(certAuthFile, certKeyFile, certFile, privateKeyPW) {
  certAuthFile = (typeof certAuthFile !== 'undefined') ? certAuthFile : 'certAuthFile';
  certKeyFile = (typeof certKeyFile !== 'undefined') ? certKeyFile : 'certKeyFile';
  certFile = (typeof certFile !== 'undefined') ? certFile : 'certFile';
  privateKeyPW = (typeof privateKeyPW !== 'undefined') ? privateKeyPW : 'privateKeyPW';

  yield browser.selectByValue('[name=ssl]', 'ALL');
}
