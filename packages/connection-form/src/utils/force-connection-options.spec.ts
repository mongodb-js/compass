import { expect } from 'chai';
import { applyForceConnectionOptions } from './force-connection-options';
import sinon from 'sinon';
import type { ConnectionOptions } from 'mongodb-data-service';

describe('applyForceConnectionOptions', function () {
  let sandbox: sinon.SinonSandbox;
  let options: ConnectionOptions;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    options = {
      connectionString: 'mongodb://localhost/',
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('does not change options by default', function () {
    expect(applyForceConnectionOptions([])(options)).to.deep.equal(options);
  });

  it('overrides set username and password', function () {
    options.connectionString = 'mongodb://a:b@localhost/';

    expect(
      applyForceConnectionOptions([
        ['username', 'user'],
        ['password', 's€cr!t'],
      ])(options)
    ).to.deep.equal({
      connectionString: 'mongodb://user:s%E2%82%ACcr!t@localhost/',
    });
  });

  it('url-encodes username and password', function () {
    options.connectionString = 'mongodb://a:b@localhost/';
    expect(
      applyForceConnectionOptions([
        ['username', 'user'],
        ['password', 's%22'], // this only makes a difference in already-url-encoded cases
      ])(options)
    ).to.deep.equal({
      connectionString: 'mongodb://user:s%2522@localhost/',
    });
  });

  it('can set connection string options', function () {
    expect(
      applyForceConnectionOptions([['readPreference', 'secondary']])(options)
    ).to.deep.equal({
      connectionString: 'mongodb://localhost/?readPreference=secondary',
    });
  });

  it('can override connection string options', function () {
    options.connectionString = 'mongodb://localhost/?readPreference=primary';

    expect(
      applyForceConnectionOptions([['readPreference', 'secondary']])(options)
    ).to.deep.equal({
      connectionString: 'mongodb://localhost/?readPreference=secondary',
    });
  });

  it('can override and set repeated connection string options', function () {
    options.connectionString =
      'mongodb://localhost/?readPreference=primary&READPREFERENCETAGS=nodeType:NONE';

    expect(
      applyForceConnectionOptions([
        ['readPreference', 'secondary'],
        ['readPreferenceTags', 'nodeType:ANALYTICS'],
        ['readPreferenceTags', 'nodeType:READ_ONLY'],
      ])(options)
    ).to.deep.equal({
      connectionString:
        'mongodb://localhost/?readPreference=secondary&readPreferenceTags=nodeType%3AANALYTICS&readPreferenceTags=nodeType%3AREAD_ONLY',
    });
  });
});
