import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

import ConnectionForm from './connection-form';

const atlasConnectionString =
  'mongodb+srv://cluster0.abcde.mongodb.net/?authMechanism=MONGODB-X509&tls=true&appName=Data+Explorer';

const atlasConnectionInfo: ConnectionInfo = {
  id: 'atlas',
  connectionOptions: { connectionString: atlasConnectionString },
  atlasMetadata: {
    orgId: 'org',
    projectId: 'project',
    clusterName: 'Cluster0',
  } as ConnectionInfo['atlasMetadata'],
};

const localConnectionInfo: ConnectionInfo = {
  id: 'local',
  connectionOptions: { connectionString: atlasConnectionString },
};

function renderForm(
  initialConnectionInfo: ConnectionInfo,
  callbacks: {
    onSaveClicked?: sinon.SinonSpy;
    onConnectClicked?: sinon.SinonSpy;
    onSaveAndConnectClicked?: sinon.SinonSpy;
  } = {}
) {
  render(
    <ConnectionForm
      initialConnectionInfo={initialConnectionInfo}
      onCancel={() => {}}
      onSaveClicked={callbacks.onSaveClicked ?? sinon.stub().resolves()}
      onConnectClicked={callbacks.onConnectClicked ?? sinon.spy()}
      onSaveAndConnectClicked={callbacks.onSaveAndConnectClicked ?? sinon.spy()}
    />
  );
}

describe('ConnectionForm with an Atlas connection', function () {
  it('shows the session-only edit header', function () {
    renderForm(atlasConnectionInfo);
    expect(screen.getByRole('heading', { name: 'Edit Connection' })).to.exist;
    expect(
      screen.getByText(
        'Manage your connection settings. Changes are not preserved across sessions.'
      )
    ).to.exist;
  });

  it('hides personalization, favorite and help cards', function () {
    renderForm(atlasConnectionInfo);
    expect(screen.queryByTestId('personalization-name-input')).to.not.exist;
    expect(screen.queryByTestId('personalization-color-input')).to.not.exist;
    expect(screen.queryByTestId('personalization-favorite-checkbox')).to.not
      .exist;
    expect(screen.queryByText('How do I find my connection string in Atlas?'))
      .to.not.exist;
  });

  it('only offers Cancel and Connect, and connecting applies the edited info', function () {
    const onSaveAndConnectClicked = sinon.spy();
    renderForm(atlasConnectionInfo, { onSaveAndConnectClicked });

    expect(screen.getByTestId('cancel-button')).to.exist;
    expect(screen.getByTestId('connect-button')).to.have.text('Connect');
    expect(screen.queryByTestId('save-button')).to.not.exist;
    expect(screen.queryByTestId('save-and-connect-button')).to.not.exist;

    userEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(onSaveAndConnectClicked).to.have.been.calledOnce;
  });

  it('only shows the read preference options', function () {
    renderForm(atlasConnectionInfo);
    expect(screen.getByTestId('read-preferences')).to.be.visible;
    expect(screen.queryByTestId('connectionString')).to.not.exist;
    expect(screen.queryByTestId('advanced-connection-options')).to.not.exist;
    expect(screen.queryByRole('tab')).to.not.exist;
  });

  it('applies the read preference to the connection info', function () {
    const onSaveAndConnectClicked = sinon.spy();
    renderForm(atlasConnectionInfo, { onSaveAndConnectClicked });

    userEvent.click(
      screen.getByRole('radio', { name: 'Secondary' }),
      undefined,
      { skipPointerEventsCheck: true }
    );
    userEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(onSaveAndConnectClicked).to.have.been.calledOnce;
    expect(
      onSaveAndConnectClicked.firstCall.args[0].connectionOptions
        .connectionString
    ).to.equal(`${atlasConnectionString}&readPreference=secondary`);
  });

  it('only shows the disconnect banner while connected', function () {
    render(
      <ConnectionForm
        initialConnectionInfo={atlasConnectionInfo}
        disableEditingConnectedConnection
        onDisconnectClicked={() => {}}
        onCancel={() => {}}
        onSaveClicked={sinon.stub().resolves()}
        onConnectClicked={sinon.spy()}
      />
    );
    expect(
      screen.getByTestId('disabled-connected-connection-banner')
    ).to.have.text(
      'To change the read preference, you must first disconnect. Beware that disconnecting might cause work in progress to be lost.Disconnect'
    );
    expect(screen.queryByTestId('read-preferences')).to.not.exist;
    expect(screen.queryByTestId('connect-button')).to.not.exist;
  });

  it('connects with X.509 and no client certificate', function () {
    const onSaveAndConnectClicked = sinon.spy();
    renderForm(atlasConnectionInfo, { onSaveAndConnectClicked });
    userEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(onSaveAndConnectClicked).to.have.been.calledOnce;
    expect(screen.queryByTestId('connection-error-summary')).to.not.exist;
  });
});

describe('ConnectionForm without Atlas metadata', function () {
  it('keeps the regular header, personalization and buttons', function () {
    renderForm(localConnectionInfo);
    expect(screen.getByRole('heading', { name: 'New Connection' })).to.exist;
    expect(screen.getByTestId('personalization-name-input')).to.exist;
    expect(screen.getByRole('button', { name: 'Save' })).to.exist;
    expect(screen.getByRole('button', { name: 'Connect' })).to.exist;
    expect(screen.getByRole('button', { name: 'Save & Connect' })).to.exist;
  });

  it('keeps the connection string and advanced options', function () {
    renderForm(localConnectionInfo);
    expect(screen.getByTestId('connectionString')).to.exist;
    expect(screen.getByTestId('advanced-connection-options')).to.exist;
    expect(screen.queryByTestId('read-preferences')).to.not.exist;
  });

  it('still requires a client certificate for X.509', async function () {
    const onSaveAndConnectClicked = sinon.spy();
    renderForm(localConnectionInfo, { onSaveAndConnectClicked });
    userEvent.click(screen.getByRole('button', { name: 'Save & Connect' }));
    await waitFor(() => {
      expect(
        screen.getAllByText(
          'A Client Certificate is required with x509 authentication.'
        )[0]
      ).to.be.visible;
    });
    expect(onSaveAndConnectClicked).to.not.have.been.called;
  });
});
