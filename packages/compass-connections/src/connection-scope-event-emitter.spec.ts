import { expect } from 'chai';
import { spy } from 'sinon';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { ConnectionScopedGlobalAppRegistry } from './connection-scope-event-emitter';

const CONNECTION_INFO: ConnectionInfo = {
  id: '1234',
  connectionOptions: {
    connectionString: 'mongodb://webscales.com:27017',
  },
};

describe('ConnectionScopedGlobalAppRegistry', function () {
  it('should not change the payload if is null or undefined', function () {
    const emitSpy = spy();
    const newAppRegistryEmitter = new ConnectionScopedGlobalAppRegistry<'test'>(
      emitSpy,
      CONNECTION_INFO
    );

    newAppRegistryEmitter.emit('test');
    expect(emitSpy).to.have.been.calledWith('test');
  });

  it('should not add the current connection info', function () {
    const emitSpy = spy();
    const newAppRegistryEmitter = new ConnectionScopedGlobalAppRegistry<'test'>(
      emitSpy,
      CONNECTION_INFO
    );

    newAppRegistryEmitter.emit('test', { record: true });
    expect(emitSpy).to.have.been.calledWith('test', {
      sourceConnectionInfo: CONNECTION_INFO,
      record: true,
    });
  });
});
