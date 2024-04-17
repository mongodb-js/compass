import { expect } from 'chai';
import { spy } from 'sinon';
import type { ConnectionInfoAccess } from './connection-info-provider';
import { ConnectionScopedAppRegistryImpl } from './connection-scoped-app-registry';

const connectionInfoAccess: ConnectionInfoAccess = {
  getCurrentConnectionInfo() {
    return {
      id: '1234',
      connectionOptions: {
        connectionString: 'mongodb://webscales.com:27017',
      },
    };
  },
};

describe('ConnectionScopedGlobalAppRegistry', function () {
  it('should add sourceConnectionInfoId as extra args when payload is not provided', function () {
    const emitSpy = spy();
    const newAppRegistryEmitter =
      new ConnectionScopedAppRegistryImpl<'schema-analyzed'>(
        emitSpy,
        connectionInfoAccess
      );

    newAppRegistryEmitter.emit('schema-analyzed');
    expect(emitSpy).to.have.been.calledWith('schema-analyzed', {
      sourceConnectionInfoId: '1234',
    });
  });

  it('should add the sourceConnectionInfoId as extra args also when payload is provided', function () {
    const emitSpy = spy();
    const newAppRegistryEmitter =
      new ConnectionScopedAppRegistryImpl<'schema-analyzed'>(
        emitSpy,
        connectionInfoAccess
      );

    newAppRegistryEmitter.emit('schema-analyzed', { record: true });
    expect(emitSpy).to.have.been.calledWith(
      'schema-analyzed',
      {
        record: true,
      },
      {
        sourceConnectionInfoId: '1234',
      }
    );
  });
});
