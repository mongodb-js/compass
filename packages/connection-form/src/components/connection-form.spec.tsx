import React from 'react';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  getByText,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import ConnectionForm from './connection-form';
import type { ConnectionFormProps } from './connection-form';
import Sinon from 'sinon';
import { defaultConnectionString } from '../constants/default-connection';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

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
const favoriteText = 'FAVORITE';

describe('ConnectionForm Component', function () {
  let preferences: PreferencesAccess;
  function renderForm(props: Partial<ConnectionFormProps> = {}) {
    return render(
      <PreferencesProvider value={preferences}>
        <ConnectionForm
          initialConnectionInfo={{
            id: 'test',
            connectionOptions: {
              connectionString:
                'mongodb://pineapple:orangutans@localhost:27019',
            },
          }}
          onSaveClicked={noop}
          {...props}
        />
      </PreferencesProvider>
    );
  }

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(function () {
    cleanup();
  });

  it('should show the heading', function () {
    renderForm();
    expect(screen.getByText('New Connection')).to.exist;
  });

  it('should show the connect button', function () {
    renderForm();
    const button = screen.getByText('Connect').closest('button');
    expect(button?.getAttribute('aria-disabled')).to.not.equal('true');
  });

  it('should render the connection string textbox', function () {
    renderForm();
    const textArea = screen.getByTestId('connectionString');
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

  // TODO(COMPASS-7762)
  context.skip('when preferences.showFavoriteActions === false', function () {
    it('should not render the favorite button', function () {
      renderForm({
        preferences: {
          showFavoriteActions: false,
        },
      });
      expect(screen.queryByText(favoriteText)).to.not.exist;
    });
  });

  it('should render an error with an invalid connection string', function () {
    render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveClicked={noop}
      />
    );
    expect(screen.getByText('Invalid connection string "pineapples"')).to.be
      .visible;
  });

  // TODO(COMPASS-7762)
  it.skip('should show a button to save a connection', function () {
    render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveClicked={noop}
      />
    );
    expect(screen.getByText(favoriteText).closest('button')).to.be.visible;
  });

  // TODO(COMPASS-7762)
  it.skip('should show the saved connection modal when the favorite button is clicked', function () {
    render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveClicked={noop}
      />
    );

    expect(screen.queryByText('Save connection to favorites')).to.not.exist;

    const button = screen.getByText(favoriteText).closest('button');
    if (button) {
      fireEvent.click(button);
    }

    expect(screen.getByText('Save connection to favorites')).to.be.visible;
  });

  it('should render a connection error', function () {
    render(
      <ConnectionForm
        connectionErrorMessage="connection error"
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
        }}
        onSaveClicked={noop}
      />
    );

    expect(screen.getByText('connection error')).to.be.visible;
  });

  // TODO(COMPASS-7762)
  it.skip('should show a Save & Connect button when there is no existing connection', function () {
    render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveClicked={noop}
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
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
          favorite: {
            name: 'foo',
          },
        }}
        onSaveClicked={noop}
      />
    );

    expect(() => screen.getByText(saveAndConnectText)).to.throw;
  });

  it('should not include the help panels', function () {
    expect(screen.queryByText(/How do I find my/)).to.be.null;
    expect(screen.queryByText(/How do I format my/)).to.be.null;
  });

  context('when multiple connection management is enabled', function () {
    let onCancel: Sinon.SinonSpy;
    beforeEach(async function () {
      onCancel = Sinon.spy();
      await preferences.savePreferences({
        enableMultipleConnectionSystem: true,
      });
      renderForm({
        initialConnectionInfo: DEFAULT_CONNECTION,
        preferences: {
          protectConnectionStringsForNewConnections: false,
          protectConnectionStrings: false,
        },
        onCancel,
      });
    });

    it('should not show the old favorite button', function () {
      expect(screen.queryByTestId('edit-favorite-icon-button')).to.be.null;
    });

    it('should include the help panels', function () {
      expect(screen.getByText(/How do I find my/)).to.be.visible;
      expect(screen.getByText(/How do I format my/)).to.be.visible;
    });

    it('should show a Cancel button', function () {
      screen.debug(screen.getByTestId('cancel-button'));
      const button = screen.queryByRole('button', { name: 'Cancel' });

      expect(button).to.be.visible;

      button?.click();

      expect(onCancel).to.have.been.called;
    });

    describe('name input', function () {
      it('should sync with the href of the connection string unless it has been edited', async function () {
        const connectionString = screen.getByTestId('connectionString');
        userEvent.clear(connectionString);

        await waitFor(() => expect(connectionString.value).to.equal(''));

        userEvent.paste(connectionString, 'mongodb://myserver:27017/');

        await waitFor(() =>
          expect(connectionString.value).to.equal('mongodb://myserver:27017/')
        );

        const personalizationName = screen.getByTestId(
          'personalization-name-input'
        );
        expect(personalizationName.value).to.equal('myserver:27017');
      });

      it('should not sync with the href of the connection string when it has been edited', async function () {
        const connectionString = screen.getByTestId('connectionString');
        const personalizationName = screen.getByTestId(
          'personalization-name-input'
        );

        userEvent.clear(personalizationName);
        userEvent.clear(connectionString);

        await waitFor(() => {
          expect(personalizationName.value).to.equal('');
          expect(connectionString.value).to.equal('');
        });

        userEvent.paste(personalizationName, 'my happy name');

        await waitFor(() =>
          expect(personalizationName.value).to.equal('my happy name')
        );

        userEvent.paste(connectionString, 'mongodb://webscale:27017/');

        await waitFor(() =>
          expect(connectionString.value).to.equal('mongodb://webscale:27017/')
        );

        expect(personalizationName.value).to.equal('my happy name');
      });
    });
  });
});
