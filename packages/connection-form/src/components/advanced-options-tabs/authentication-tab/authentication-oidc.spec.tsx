import React from 'react';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import type { ConnectionOptions } from 'mongodb-data-service';

import ConnectionForm from '../../../';

const deviceAuthFlowText = 'Enable Device Authentication Flow';

async function renderConnectionForm(
  connectSpy: (
    expected: ConnectionOptions | ((expected: ConnectionOptions) => void)
  ) => Promise<void>,
  { showOIDCDeviceAuthFlow }: { showOIDCDeviceAuthFlow: boolean }
) {
  render(
    <ConnectionForm
      initialConnectionInfo={{
        id: 'conn-1',
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
      }}
      onSaveAndConnectClicked={(connectionInfo) => {
        void connectSpy(connectionInfo.connectionOptions);
      }}
      enableOidc={true}
      showOIDCDeviceAuthFlow={showOIDCDeviceAuthFlow}
      onSaveClicked={() => {
        return Promise.resolve();
      }}
    />
  );

  expect(connectSpy).not.to.have.been.called;

  await openAuthOIDC();
  openOptionsAccordion();
}

const openAuthOIDC = async () => {
  fireEvent.click(screen.getByTestId('advanced-connection-options'));
  const tabTestId = 'connection-authentication-tab';
  await waitFor(() => screen.getAllByTestId(tabTestId));
  // NOTE: for some reason data-testids gets duplicated both in the
  // tab button and in the tab panel.
  fireEvent.click(screen.getAllByTestId(tabTestId)[0]);

  // Click oidc auth.
  fireEvent.click(
    screen.getByTestId('connection-authentication-method-MONGODB-OIDC-button')
  );
};

const openOptionsAccordion = () =>
  fireEvent.click(screen.getByText('OIDC Options'));

describe('Authentication OIDC Connection Form', function () {
  let expectToConnectWith: (
    expected: ConnectionOptions | ((expected: ConnectionOptions) => void)
  ) => Promise<void>;
  let connectSpy: sinon.SinonSpy;

  beforeEach(function () {
    connectSpy = sinon.spy();
    expectToConnectWith = async (
      expected: ConnectionOptions | ((expected: ConnectionOptions) => void)
    ): Promise<void> => {
      connectSpy.resetHistory();
      fireEvent.click(screen.getByTestId('connect-button'));
      try {
        await waitFor(() => expect(connectSpy).to.have.been.calledOnce);
      } catch (e) {
        // this only finds something if it is a validation error
        const errors = screen.getByTestId(
          'connection-error-summary'
        ).textContent;
        throw new Error(`connect was not called: errors = ${errors ?? ''}`);
      }

      if (typeof expected === 'function') {
        expected(connectSpy.getCall(0).args[0]);
      } else {
        expect(connectSpy.getCall(0).args[0]).to.be.deep.equal(expected);
      }
    };
  });

  afterEach(function () {
    cleanup();
  });

  describe('when rendered', function () {
    beforeEach(async function () {
      await renderConnectionForm(connectSpy, { showOIDCDeviceAuthFlow: false });
    });

    it('handles principal (username) changes', async function () {
      fireEvent.change(screen.getByTestId('connection-oidc-username-input'), {
        target: { value: 'goodSandwich' },
      });

      await expectToConnectWith({
        connectionString:
          'mongodb://goodSandwich@localhost:27017/?authMechanism=MONGODB-OIDC&authSource=%24external',
      });
    });

    it('handles the auth redirect flow uri changes', async function () {
      fireEvent.change(
        screen.getByTestId('connection-oidc-auth-code-flow-redirect-uri-input'),
        {
          target: { value: 'goodSandwiches' },
        }
      );

      await expectToConnectWith({
        connectionString:
          'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC&authSource=%24external',
        oidc: {
          redirectURI: 'goodSandwiches',
        },
      });
    });

    it('handles the Use ID token instead of Access Token checkbox', async function () {
      fireEvent.click(screen.getByText('Use ID token instead of Access Token'));
      await expectToConnectWith({
        connectionString:
          'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC&authSource=%24external',
        oidc: {
          passIdTokenAsAccessToken: true,
        },
      });
    });

    it('handles the Use ID token instead of Access Token checkbox on and off', async function () {
      fireEvent.click(screen.getByText('Use ID token instead of Access Token'));
      fireEvent.click(screen.getByText('Use ID token instead of Access Token'));
      await expectToConnectWith({
        connectionString:
          'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC&authSource=%24external',
        oidc: {},
      });
    });

    for (let i = 1; i < 3; i++) {
      it(`handles the 'Send a nonce in the Auth Code Request' checkbox clicked ${i} time(s)`, async function () {
        for (let j = 0; j < i; j++) {
          userEvent.click(
            screen.getByText('Send a nonce in the Auth Code Request')
          );
        }

        await expectToConnectWith({
          connectionString:
            'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC&authSource=%24external',
          // The default value is checked, which means we should NOT skip the nonce.
          oidc:
            i % 2 === 0
              ? {}
              : {
                  skipNonceInAuthCodeRequest: true,
                },
        });
      });
    }

    it('handles the Consider Target Endpoint Trusted checkbox', async function () {
      fireEvent.click(screen.getByText('Consider Target Endpoint Trusted'));
      await expectToConnectWith({
        connectionString:
          'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC&authSource=%24external',
        oidc: {
          enableUntrustedEndpoints: true,
        },
      });
    });

    it('handles the Consider Target Endpoint Trusted checkbox on and off', async function () {
      fireEvent.click(screen.getByText('Consider Target Endpoint Trusted'));
      fireEvent.click(screen.getByText('Consider Target Endpoint Trusted'));
      await expectToConnectWith({
        connectionString:
          'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC&authSource=%24external',
        oidc: {},
      });
    });

    it('does not show the device authentication flow checkbox', function () {
      expect(screen.queryByText(deviceAuthFlowText)).to.not.exist;
    });
  });

  describe('when rendered and the showOIDCDeviceAuthFlow setting is enabled', function () {
    beforeEach(async function () {
      await renderConnectionForm(connectSpy, { showOIDCDeviceAuthFlow: true });
    });

    it('handles the enable device authentication flow checkbox', async function () {
      fireEvent.click(screen.getByText(deviceAuthFlowText));
      await expectToConnectWith({
        connectionString:
          'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC&authSource=%24external',
        oidc: {
          allowedFlows: ['auth-code', 'device-auth'],
        },
      });
    });

    it('handles the enable device authentication flow checkbox on and off', async function () {
      fireEvent.click(screen.getByText(deviceAuthFlowText));
      fireEvent.click(screen.getByText(deviceAuthFlowText));
      await expectToConnectWith({
        connectionString:
          'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC&authSource=%24external',
        oidc: {
          allowedFlows: ['auth-code'],
        },
      });
    });
  });
});
