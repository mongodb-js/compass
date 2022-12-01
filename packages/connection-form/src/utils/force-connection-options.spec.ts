import { expect } from 'chai';
import { applyForceConnectionOptions } from './force-connection-options';
import type { AllPreferences } from 'compass-preferences-model';
import preferences from 'compass-preferences-model';
import sinon from 'sinon';
import type { ConnectionOptions } from 'mongodb-data-service';

describe('applyForceConnectionOptions', function () {
  let sandbox: sinon.SinonSandbox;
  let options: ConnectionOptions;
  let prefs: Partial<AllPreferences>;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    options = {
      connectionString: 'mongodb://localhost/',
    };
    prefs = {};
    sandbox
      .stub(preferences, 'getPreferences')
      .returns(prefs as AllPreferences);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('does not change options by default', function () {
    expect(applyForceConnectionOptions(options)).to.deep.equal(options);
  });

  it('overrides set username and password', function () {
    options.connectionString = 'mongodb://a:b@localhost/';
    prefs.forceConnectionOptions = [
      ['username', 'user'],
      ['password', 's€cr!t'],
    ];
    expect(applyForceConnectionOptions(options)).to.deep.equal({
      connectionString: 'mongodb://user:s%E2%82%ACcr!t@localhost/',
    });
  });

  it('url-encodes username and password', function () {
    options.connectionString = 'mongodb://a:b@localhost/';
    prefs.forceConnectionOptions = [
      ['username', 'user'],
      ['password', 's%22'], // this only makes a difference in already-url-encoded cases
    ];
    expect(applyForceConnectionOptions(options)).to.deep.equal({
      connectionString: 'mongodb://user:s%2522@localhost/',
    });
  });

  it('can set connection string options', function () {
    prefs.forceConnectionOptions = [['readPreference', 'secondary']];
    expect(applyForceConnectionOptions(options)).to.deep.equal({
      connectionString: 'mongodb://localhost/?readPreference=secondary',
    });
  });

  it('can override connection string options', function () {
    options.connectionString = 'mongodb://localhost/?readPreference=primary';
    prefs.forceConnectionOptions = [['readPreference', 'secondary']];
    expect(applyForceConnectionOptions(options)).to.deep.equal({
      connectionString: 'mongodb://localhost/?readPreference=secondary',
    });
  });

  it('can override and set repeated connection string options', function () {
    options.connectionString =
      'mongodb://localhost/?readPreference=primary&READPREFERENCETAGS=nodeType:NONE';
    prefs.forceConnectionOptions = [
      ['readPreference', 'secondary'],
      ['readPreferenceTags', 'nodeType:ANALYTICS'],
      ['readPreferenceTags', 'nodeType:READ_ONLY'],
    ];

    expect(applyForceConnectionOptions(options)).to.deep.equal({
      connectionString:
        'mongodb://localhost/?readPreference=secondary&readPreferenceTags=nodeType%3AANALYTICS&readPreferenceTags=nodeType%3AREAD_ONLY',
    });
  });
});
