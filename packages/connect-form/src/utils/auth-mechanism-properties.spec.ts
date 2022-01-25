import { expect } from 'chai';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { parseAuthMechanismProperties } from './auth-mechanism-properties';

describe('parseAuthMechanismProperties', function () {
  it('parses legit authMechanismProperties string', function () {
    const props = parseAuthMechanismProperties(
      new ConnectionStringUrl(
        'mongodb://localhost?authMechanismProperties=SERVICE_NAME:serviceName'
      )
    );

    expect(props.get('SERVICE_NAME')).to.equal('serviceName');
  });

  it('parses broken authMechanismProperties string as empty', function () {
    const props = parseAuthMechanismProperties(
      new ConnectionStringUrl(
        'mongodb://localhost?authMechanismProperties=broken'
      )
    );

    expect(props.get('SERVICE_NAME')).to.equal(undefined);
  });
});
