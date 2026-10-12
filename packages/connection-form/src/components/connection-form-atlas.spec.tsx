import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
  within,
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

function openAdvancedOptions() {
  userEvent.click(screen.getByTestId('advanced-connection-options'));
}

function openTab(name: string) {
  userEvent.click(screen.getByRole('tab', { name }));
}

function getTabNames(): string[] {
  return screen.getAllByRole('tab').map((tab) => tab.textContent ?? '');
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

  it('does not allow editing the connection string', function () {
    renderForm(atlasConnectionInfo);
    expect(screen.queryByTestId('toggle-edit-connection-string')).to.not.exist;
    expect(screen.getByTestId('connectionString')).to.have.attribute(
      'aria-disabled',
      'true'
    );
  });

  it('opens the advanced options on the Advanced tab', function () {
    renderForm(atlasConnectionInfo);
    expect(screen.getByRole('tab', { name: 'Advanced' })).to.have.attribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByTestId('read-preferences')).to.be.visible;
  });

  it('only shows the General and Advanced tabs', function () {
    renderForm(atlasConnectionInfo);
    expect(getTabNames()).to.deep.equal(['General', 'Advanced']);
  });

  it('locks the scheme and hosts on the General tab', function () {
    renderForm(atlasConnectionInfo);
    openTab('General');

    for (const name of ['mongodb', 'mongodb+srv']) {
      expect(screen.getByRole('radio', { name })).to.have.attribute(
        'aria-disabled',
        'true'
      );
    }
    expect(screen.getByTestId('connection-host-input')).to.have.attribute(
      'aria-disabled',
      'true'
    );
    expect(screen.queryByTestId('connection-add-host-button')).to.not.exist;
  });

  it('locks everything on the Advanced tab except read preference', function () {
    renderForm(atlasConnectionInfo);
    openTab('Advanced');

    expect(screen.getByTestId('replica-set')).to.have.attribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByTestId('default-database')).to.have.attribute(
      'aria-disabled',
      'true'
    );
    const appNameOption = within(screen.getByTestId('url-option-entry-0'));
    expect(
      appNameOption.getByTestId('leafygreen-ui-select-menubutton')
    ).to.have.attribute('aria-disabled', 'true');
    expect(appNameOption.getByTestId('appName-input-field')).to.have.attribute(
      'aria-disabled',
      'true'
    );
    expect(screen.queryByTestId('connection-url-options-remove-button')).to.not
      .exist;

    userEvent.click(
      screen.getByRole('radio', { name: 'Secondary' }),
      undefined,
      {
        skipPointerEventsCheck: true,
      }
    );
    expect(
      screen.getByTestId<HTMLTextAreaElement>('connectionString').value
    ).to.contain('readPreference=secondary');
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

  it('starts with the advanced options collapsed', function () {
    renderForm(localConnectionInfo);
    expect(screen.queryByRole('tab', { name: 'Advanced' })).to.not.exist;
  });

  it('shows every tab', function () {
    renderForm(localConnectionInfo);
    openAdvancedOptions();
    expect(getTabNames()).to.deep.equal([
      'General',
      'Authentication',
      'TLS/SSL',
      'Proxy/SSH',
      'In-Use Encryption',
      'Advanced',
    ]);
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
