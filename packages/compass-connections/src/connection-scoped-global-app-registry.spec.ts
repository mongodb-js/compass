import { expect } from 'chai';
import { spy } from 'sinon';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { ConnectionScopedGlobalAppRegistryImpl } from './connection-scoped-global-app-registry';

const CONNECTION_INFO: ConnectionInfo = {
  id: '1234',
  connectionOptions: {
    connectionString: 'mongodb://webscales.com:27017',
  },
};

describe('ConnectionScopedGlobalAppRegistry', function () {
  it('should not change the payload if is null or undefined', function () {
    const emitSpy = spy();
    const newAppRegistryEmitter =
      new ConnectionScopedGlobalAppRegistryImpl<'schema-analyzed'>(
        emitSpy,
        CONNECTION_INFO
      );

    newAppRegistryEmitter.emit('schema-analyzed');
    expect(emitSpy).to.have.been.calledWith('schema-analyzed');
  });

  it('should not add the current connection info', function () {
    const emitSpy = spy();
    const newAppRegistryEmitter =
      new ConnectionScopedGlobalAppRegistryImpl<'schema-analyzed'>(
        emitSpy,
        CONNECTION_INFO
      );

    newAppRegistryEmitter.emit('schema-analyzed', { record: true });
    expect(emitSpy).to.have.been.calledWith('schema-analyzed', {
      sourceConnectionInfo: CONNECTION_INFO,
      record: true,
    });
  });
});
