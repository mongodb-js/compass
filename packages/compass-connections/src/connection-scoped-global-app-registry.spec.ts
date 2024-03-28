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
  it('should add sourceConnectionInfoId as extra args when payload is not provided', function () {
    const emitSpy = spy();
    const newAppRegistryEmitter =
      new ConnectionScopedGlobalAppRegistryImpl<'schema-analyzed'>(
        emitSpy,
        CONNECTION_INFO.id
      );

    newAppRegistryEmitter.emit('schema-analyzed');
    expect(emitSpy).to.have.been.calledWith('schema-analyzed', null, {
      sourceConnectionInfoId: CONNECTION_INFO.id,
    });
  });

  it('should add the sourceConnectionInfoId as extra args also when payload is provided', function () {
    const emitSpy = spy();
    const newAppRegistryEmitter =
      new ConnectionScopedGlobalAppRegistryImpl<'schema-analyzed'>(
        emitSpy,
        CONNECTION_INFO.id
      );

    newAppRegistryEmitter.emit('schema-analyzed', { record: true });
    expect(emitSpy).to.have.been.calledWith(
      'schema-analyzed',
      {
        record: true,
      },
      {
        sourceConnectionInfoId: CONNECTION_INFO.id,
      }
    );
  });
});
