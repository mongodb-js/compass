import React from 'react';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import type { ConnectionOptions } from 'mongodb-data-service';
import preferences from 'compass-preferences-model';

import ConnectionForm from '../../../';

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

describe('AuthenticationOIDC Connection Form', function () {
  let expectToConnectWith;
  let sandbox: sinon.SinonSandbox;

  beforeEach(async function () {
    const connectSpy = sinon.spy();

    sandbox = sinon.createSandbox();
    // TODO(COMPASS-6803): Remove feature flag, remove this sandbox.
    sandbox.stub(preferences, 'getPreferences').callsFake(() => {
      return {
        enableOIDC: true,
      } as any;
    });

    expectToConnectWith = async (
      expected: ConnectionOptions | ((ConnectionOptions) => void)
    ): Promise<void> => {
      connectSpy.resetHistory();
      fireEvent.click(screen.getByTestId('connect-button'));
      try {
        await waitFor(() => expect(connectSpy).to.have.been.calledOnce);
      } catch (e) {
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

    render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'conn-1',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
        }}
        onConnectClicked={(connectionInfo) => {
          connectSpy(connectionInfo.connectionOptions);
        }}
      />
    );

    expect(connectSpy).not.to.have.been.called;

    await openAuthOIDC();
    openOptionsAccordion();
  });
  afterEach(function () {
    sandbox.restore();
    cleanup();
  });

  it('handles principal (username) changes', async function () {
    fireEvent.change(screen.getAllByRole('textbox')[1], {
      target: { value: 'goodSandwich' },
    });

    await expectToConnectWith({
      connectionString:
        'mongodb://goodSandwich@localhost:27017/?authMechanism=MONGODB-OIDC',
    });
  });

  it('handles the auth redirect flow uri changes', async function () {
    fireEvent.change(screen.getAllByRole('textbox')[2], {
      target: { value: 'goodSandwiches' },
    });

    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC',
      oidc: {
        redirectURI: 'goodSandwiches',
      },
    });
  });

  it('handles the allow untrusted endpoint checkbox', async function () {
    fireEvent.click(screen.getByText('Enable untrusted target endpoint'));
    await expectToConnectWith({
      connectionString:
        'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC&authMechanismProperties=ALLOWED_HOSTS%3A*',
    });
  });

  it('handles the allow untrusted endpoint checkbox on and off', async function () {
    fireEvent.click(screen.getByText('Enable untrusted target endpoint'));
    fireEvent.click(screen.getByText('Enable untrusted target endpoint'));
    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC',
    });
  });

  it('handles the enable device authentication flow checkbox', async function () {
    fireEvent.click(screen.getByText('Enable device authentication flow'));
    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC',
      oidc: {
        allowedFlows: ['device-auth'],
      },
    });
  });

  it('handles the enable device authentication flow checkbox on and off', async function () {
    fireEvent.click(screen.getByText('Enable device authentication flow'));
    fireEvent.click(screen.getByText('Enable device authentication flow'));
    await expectToConnectWith({
      connectionString: 'mongodb://localhost:27017/?authMechanism=MONGODB-OIDC',
      oidc: {},
    });
  });
});
