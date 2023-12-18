import React from 'react';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  getByText,
} from '@testing-library/react';
import { expect } from 'chai';

import ConnectionForm from './connection-form';
import type { ConnectionFormProps } from './connection-form';
import Sinon from 'sinon';
import { defaultConnectionString } from '../constants/default-connection';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';

const DEFAULT_CONNECTION: ConnectionInfo = {
  id: 'default',
  connectionOptions: {
    connectionString: defaultConnectionString,
  },
};

const noop = (): any => {
  /* no-op */
};

const saveAndConnectText = 'Save & Connect';

function renderForm(props: Partial<ConnectionFormProps> = {}) {
  return render(
    <ConnectionForm
      onConnectClicked={noop}
      initialConnectionInfo={{
        id: 'test',
        connectionOptions: {
          connectionString: 'mongodb://pineapple:orangutans@localhost:27019',
        },
      }}
      onSaveConnectionClicked={noop}
      {...props}
    />
  );
}

describe('ConnectionForm Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should show the heading', function () {
    renderForm();
    expect(screen.getByRole('heading')).to.have.text('New Connection');
  });

  it('should show the connect button', function () {
    renderForm();
    const button = screen.getByText('Connect').closest('button');
    expect(button).to.not.match('disabled');
  });

  it('should render the connection string textbox', function () {
    renderForm();
    const textArea = screen.getByRole('textbox');
    expect(textArea).to.have.text('mongodb://pineapple:*****@localhost:27019/');
  });

  describe('"Edit connection string" toggle state', function () {
    let sandbox: Sinon.SinonSandbox;

    beforeEach(function () {
      sandbox = Sinon.createSandbox();
    });

    afterEach(function () {
      sandbox.restore();
    });

    context(
      'when preferences.protectConnectionStringsForNewConnections === true',
      function () {
        context(
          'and preferences.protectConnectionStrings === false',
          function () {
            it('should render the toggle button in the off state for default connection', function () {
              renderForm({
                initialConnectionInfo: DEFAULT_CONNECTION,
                preferences: {
                  protectConnectionStringsForNewConnections: true,
                  protectConnectionStrings: false,
                },
              });

              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('false');
            });

            it('should render the toggle button in the off state for existing connection', function () {
              renderForm({
                preferences: {
                  protectConnectionStringsForNewConnections: true,
                  protectConnectionStrings: false,
                },
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('false');
            });
          }
        );

        context(
          'and preferences.protectConnectionStrings === true',
          function () {
            it('should render the toggle button in the off state for default connection', function () {
              renderForm({
                initialConnectionInfo: DEFAULT_CONNECTION,
                preferences: {
                  protectConnectionStringsForNewConnections: true,
                  protectConnectionStrings: true,
                },
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('false');
            });

            it('should not render the toggle button for existing connection', function () {
              renderForm({
                preferences: {
                  protectConnectionStringsForNewConnections: true,
                  protectConnectionStrings: true,
                },
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .be.null;
            });
          }
        );
      }
    );

    context(
      'when preferences.protectConnectionStringsForNewConnections === false',
      function () {
        context(
          'and preferences.protectConnectionStrings === false',
          function () {
            it('should render the toggle button in the on state for default connection', function () {
              renderForm({
                initialConnectionInfo: DEFAULT_CONNECTION,
                preferences: {
                  protectConnectionStringsForNewConnections: false,
                  protectConnectionStrings: false,
                },
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('true');
            });

            it('should render the toggle button in the off state for existing connection', function () {
              renderForm({
                preferences: {
                  protectConnectionStringsForNewConnections: false,
                  protectConnectionStrings: false,
                },
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('false');
            });
          }
        );

        context(
          'and preferences.protectConnectionStrings === true',
          function () {
            it('should render the toggle button in the on state for default connection', function () {
              renderForm({
                initialConnectionInfo: DEFAULT_CONNECTION,
                preferences: {
                  protectConnectionStringsForNewConnections: false,
                  protectConnectionStrings: true,
                },
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('true');
            });

            it('should not render the toggle button for existing connection', function () {
              renderForm({
                preferences: {
                  protectConnectionStringsForNewConnections: false,
                  protectConnectionStrings: true,
                },
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .be.null;
            });
          }
        );
      }
    );
  });

  it('should render an error with an invalid connection string', function () {
    render(
      <ConnectionForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveConnectionClicked={noop}
      />
    );
    expect(screen.getByText('Invalid connection string "pineapples"')).to.be
      .visible;
  });

  it('should not show to save a connection when onSaveConnectionClicked doesnt exist', function () {
    render(
      <ConnectionForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
      />
    );
    expect(screen.queryByText('FAVORITE')).to.not.exist;
  });

  it('should show a button to save a connection when onSaveConnectionClicked exists', function () {
    render(
      <ConnectionForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveConnectionClicked={noop}
      />
    );
    expect(screen.getByText('FAVORITE').closest('button')).to.be.visible;
  });

  it('should show the saved connection modal when the favorite button is clicked', function () {
    render(
      <ConnectionForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveConnectionClicked={noop}
      />
    );

    expect(screen.queryByText('Save connection to favorites')).to.not.exist;

    fireEvent.click(screen.getByText('FAVORITE').closest('button'));

    expect(screen.getByText('Save connection to favorites')).to.be.visible;
  });

  it('should render a connection error', function () {
    render(
      <ConnectionForm
        onConnectClicked={() => {
          /* */
        }}
        connectionErrorMessage="connection error"
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
        }}
      />
    );

    expect(screen.getByText('connection error')).to.be.visible;
  });

  it('should show a Save & Connect button when there is no existing connection', function () {
    render(
      <ConnectionForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveConnectionClicked={noop}
      />
    );

    const saveAndConnectButton = screen.getByText(saveAndConnectText);
    expect(saveAndConnectButton).to.be.visible;

    fireEvent.click(saveAndConnectButton);

    expect(screen.getByText('Save connection to favorites')).to.be.visible;

    const dialog = screen.getByRole('dialog');
    expect(dialog).to.be.visible;

    expect(getByText(dialog, saveAndConnectText)).to.be.visible;
    expect(() => getByText(dialog, 'Save')).to.throw;
  });

  it('should not show a Save & Connect button when there is an existing connection', function () {
    render(
      <ConnectionForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
          favorite: {
            name: 'foo',
          },
        }}
        onSaveConnectionClicked={noop}
      />
    );

    expect(() => screen.getByText(saveAndConnectText)).to.throw;
  });

  it('should not show any save buttons when there is no save handler passed', function () {
    render(
      <ConnectionForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveConnectionClicked={undefined}
      />
    );

    const saveAndConnectButton = screen.queryByText(saveAndConnectText);
    expect(saveAndConnectButton).to.not.exist;

    const saveButton = screen.queryByText('Save');
    expect(saveButton).to.not.exist;
  });
});
