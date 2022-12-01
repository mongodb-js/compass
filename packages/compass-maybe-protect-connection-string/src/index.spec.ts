import { maybeProtectConnectionString } from './';
import { expect } from 'chai';
import sinon from 'sinon';
import preferences from 'compass-preferences-model';

const connectionString = 'mongodb://username:p4ssw0rd@localhost/';

describe('maybeProtectConnectionString', function () {
  let sandbox: sinon.SinonSandbox;
  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });
  afterEach(function () {
    return sandbox.restore();
  });

  it('passes input through if not in protected mode', function () {
    expect(maybeProtectConnectionString(connectionString)).to.equal(
      connectionString
    );
  });

  it('redacts credentials in protected mode', function () {
    sandbox
      .stub(preferences, 'getPreferences')
      .returns({ protectConnectionStrings: true } as any);
    expect(maybeProtectConnectionString(connectionString)).to.equal(
      'mongodb://<credentials>@localhost/'
    );
  });
});
