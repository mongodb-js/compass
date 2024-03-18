import { expect } from 'chai';
import { useConnectionStatus } from './use-connection-status';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { createElement } from 'react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { ConnectionInfoProvider } from '@mongodb-js/connection-storage/provider';
import {
  ConnectionsManager,
  ConnectionsManagerEvents,
  ConnectionsManagerProvider,
} from '../provider';

const CONNECTION_INFO: ConnectionInfo = {
  id: '1234',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
};

describe('useConnectionStatus', function () {
  let renderHookWithContext: typeof renderHook;
  let connectionManager: ConnectionsManager;

  beforeEach(function () {
    connectionManager = new ConnectionsManager({} as any);

    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(ConnectionInfoProvider, {
          value: CONNECTION_INFO,
          children: [
            createElement(ConnectionsManagerProvider, {
              value: connectionManager,
              children: children,
            }),
          ],
        });
      return renderHook(callback, { wrapper, ...options });
    };
  });

  describe('status of a connection', function () {
    it('should return it from the connection manager', function () {
      const { result } = renderHookWithContext(() => useConnectionStatus());
      const status = result.current.status;
      expect(status).to.equal('disconnected');
    });

    describe('when there is an update', function () {
      let result: ReturnType<typeof renderHookWithContext>['result'];

      beforeEach(function () {
        const hookResult = renderHookWithContext(() => useConnectionStatus());
        result = hookResult.result;

        const connectionManagerInspectable = connectionManager as any;
        connectionManagerInspectable.connectionStatuses.set(
          '1234',
          'connected'
        );

        connectionManager.emit(
          ConnectionsManagerEvents.ConnectionAttemptSuccessful,
          '1234',
          {} as any
        );
      });

      it('should update the status', function () {
        expect(result.current.status).to.equal('connected');
      });
    });
  });
});
