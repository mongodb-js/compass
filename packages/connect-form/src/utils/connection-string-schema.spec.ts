import { expect } from 'chai';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { tryUpdateConnectionStringSchema } from './connection-string-schema';

describe('#tryUpdateConnectionStringSchema', function () {
  it('should do nothing when updating to the same type', function () {
    const srvConnection = new ConnectionStringUrl(
      'mongodb+srv://a:b@outerspace/?ssl=false'
    );

    const newConnectionStringUrl = tryUpdateConnectionStringSchema(
      srvConnection,
      true
    );
    expect(newConnectionStringUrl.toString()).to.equal(
      'mongodb+srv://a:b@outerspace/?ssl=false'
    );
    expect(newConnectionStringUrl.isSRV).to.equal(true);

    const connectionStringUrl = new ConnectionStringUrl(
      'mongodb://a:b@outerspace:123/?ssl=false'
    );

    const updatedConnectionUrl = tryUpdateConnectionStringSchema(
      connectionStringUrl,
      false
    );
    expect(updatedConnectionUrl.toString()).to.equal(
      'mongodb://a:b@outerspace:123/?ssl=false'
    );
    expect(updatedConnectionUrl.isSRV).to.equal(false);
  });

  it('should update standard to srv', function () {
    const connectionStringUrl = new ConnectionStringUrl(
      'mongodb://a:b@outerspace:123/?ssl=false'
    );

    const newConnectionStringUrl = tryUpdateConnectionStringSchema(
      connectionStringUrl,
      true
    );
    expect(newConnectionStringUrl.toString()).to.equal(
      'mongodb+srv://a:b@outerspace/?ssl=false'
    );
    expect(newConnectionStringUrl.isSRV).to.equal(true);
  });

  it('should update standard with multiple hosts', function () {
    const connectionStringUrl = new ConnectionStringUrl(
      'mongodb://a:b@outerspace:123,backyard,cruiseship:1234,catch:22/?ssl=true'
    );

    const newConnectionStringUrl = tryUpdateConnectionStringSchema(
      connectionStringUrl,
      true
    );
    expect(newConnectionStringUrl.toString()).to.equal(
      'mongodb+srv://a:b@outerspace/?ssl=true'
    );
    expect(newConnectionStringUrl.isSRV).to.equal(true);
  });

  it('should remove directConnection when switching to srv', function () {
    const connectionStringUrl = new ConnectionStringUrl(
      'mongodb://a:b@outerspace:123/?ssl=true&directConnection=true'
    );

    const newConnectionStringUrl = tryUpdateConnectionStringSchema(
      connectionStringUrl,
      true
    );
    expect(newConnectionStringUrl.toString()).to.equal(
      'mongodb+srv://a:b@outerspace/?ssl=true'
    );
    expect(newConnectionStringUrl.isSRV).to.equal(true);
  });

  it('should update srv to standard', function () {
    const connectionStringUrl = new ConnectionStringUrl(
      'mongodb+srv://outerspace/?ssl=false'
    );

    const newConnectionStringUrl = tryUpdateConnectionStringSchema(
      connectionStringUrl,
      false
    );
    expect(newConnectionStringUrl.toString()).to.equal(
      'mongodb://outerspace:27017/?ssl=false'
    );
    expect(newConnectionStringUrl.isSRV).to.equal(false);
  });
});
