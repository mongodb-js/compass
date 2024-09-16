import { expect } from 'chai';
import { spy } from 'sinon';
import type { ConnectionInfoRef } from './connection-info-provider';
import { ConnectionScopedAppRegistryImpl } from './connection-scoped-app-registry';

const connectionInfoRef: ConnectionInfoRef = {
  get current() {
    return {
      id: '1234',
      connectionOptions: {
        connectionString: 'mongodb://webscales.com:27017',
      },
      title: '',
    };
  },
};

describe('ConnectionScopedGlobalAppRegistry', function () {
  it('should add connectionId as extra args when payload is not provided', function () {
    const emitSpy = spy();
    const newAppRegistryEmitter =
      new ConnectionScopedAppRegistryImpl<'schema-analyzed'>(
        emitSpy,
        connectionInfoRef
      );

    newAppRegistryEmitter.emit('schema-analyzed');
    expect(emitSpy).to.have.been.calledWith('schema-analyzed', {
      connectionId: '1234',
    });
  });

  it('should add the connectionId as extra args also when payload is provided', function () {
    const emitSpy = spy();
    const newAppRegistryEmitter =
      new ConnectionScopedAppRegistryImpl<'schema-analyzed'>(
        emitSpy,
        connectionInfoRef
      );

    newAppRegistryEmitter.emit('schema-analyzed', { record: true });
    expect(emitSpy).to.have.been.calledWith(
      'schema-analyzed',
      {
        record: true,
      },
      {
        connectionId: '1234',
      }
    );
  });
});
