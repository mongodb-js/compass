import { maybeProtectConnectionString } from './';
import { expect } from 'chai';

const connectionString = 'mongodb://username:p4ssw0rd@localhost/';

describe('maybeProtectConnectionString', function () {
  it('passes input through if not in protected mode', function () {
    expect(maybeProtectConnectionString(false, connectionString)).to.equal(
      connectionString
    );
  });

  it('redacts credentials in protected mode', function () {
    expect(maybeProtectConnectionString(true, connectionString)).to.equal(
      'mongodb://<credentials>@localhost/'
    );
  });
});
