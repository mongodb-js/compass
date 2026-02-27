import React from 'react';
import { expect } from 'chai';
import {
  screen,
  userEvent,
  waitFor,
  within,
} from '@mongodb-js/testing-library-compass';
import NewDiagramModal from './new-diagram-modal';
import { createNewDiagram } from '../../store/generate-diagram-wizard';
import { renderWithStore } from '../../../test/setup-store';
import type { DataModelingStore } from '../../../test/setup-store';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

function getComboboxByTestId(testId: string) {
  return within(screen.getByTestId(testId)).getByRole('combobox');
}

async function setSetupDiagramStep(
  store: DataModelingStore,
  {
    connection,
    databaseName,
    diagramName,
  }: {
    connection?: {
      id: string;
      name: string;
    };
    databaseName?: string;
    diagramName?: string;
  }
) {
  store.dispatch(createNewDiagram());

  if (connection) {
    userEvent.click(getComboboxByTestId('new-diagram-connection-selector'));
    userEvent.click(screen.getByText(connection.name));
    await waitFor(() => {
      expect(
        store.getState().generateDiagramWizard.formFields.selectedConnection
          .value
      ).to.equal(connection.id);
    });
  }

  if (databaseName) {
    userEvent.click(getComboboxByTestId('new-diagram-database-selector'));
    userEvent.click(screen.getByText(databaseName));
    await waitFor(() => {
      expect(
        store.getState().generateDiagramWizard.formFields.selectedDatabase.value
      ).to.equal(databaseName);
    });
  }

  if (diagramName) {
    // Clear the name because we auto-generate it when selecting DB
    userEvent.clear(screen.getByTestId('new-diagram-name-input'));
    await waitFor(() => {
      expect(
        store.getState().generateDiagramWizard.formFields.diagramName.value
      ).to.equal('');
    });
    userEvent.paste(screen.getByTestId('new-diagram-name-input'), diagramName);
    await waitFor(() => {
      expect(
        store.getState().generateDiagramWizard.formFields.diagramName.value
      ).to.equal(diagramName);
    });
  }
}

describe('NewDiagramModal', function () {
  context('setup-diagram step', function () {
    context('enter-name', function () {
      let store: DataModelingStore;
      let modal: HTMLElement;
      beforeEach(() => {
        const { store: setupStore } = renderWithStore(<NewDiagramModal />);
        store = setupStore;
        store.dispatch(createNewDiagram());
        modal = screen.getByTestId('new-diagram-modal');
        expect(modal).to.be.visible;
      });
      it('allows user to enter name for the model', async function () {
        userEvent.type(
          within(modal).getByTestId('new-diagram-name-input'),
          'diagram-1'
        );
        await waitFor(() => {
          expect(
            store.getState().generateDiagramWizard.formFields.diagramName.value
          ).to.equal('diagram-1');
        });
      });

      it('keeps next button disabled if diagram name is empty', async function () {
        userEvent.clear(within(modal).getByTestId('new-diagram-name-input'));
        await waitFor(() => {
          expect(
            store.getState().generateDiagramWizard.formFields.diagramName.value
          ).to.be.undefined;
        });
        const button = within(modal).getByRole('button', {
          name: /next/i,
        });
        expect(button.getAttribute('aria-disabled')).to.equal('true');
      });

      it('cancels process when cancel is clicked', function () {
        userEvent.click(
          within(modal).getByRole('button', {
            name: /cancel/i,
          })
        );
        expect(store.getState().generateDiagramWizard.inProgress).to.be.false;
      });
    });

    context('select-connection', function () {
      it('shows error if there are no connections', function () {
        const { store } = renderWithStore(<NewDiagramModal />, {
          connections: [],
        });
        store.dispatch(createNewDiagram());
        expect(
          screen.queryByText(
            /You do not have any connections, create a new connection first./
          )
        ).to.exist;
      });

      it('shows list of connections and allows user to select one', function () {
        const { store } = renderWithStore(<NewDiagramModal />);
        store.dispatch(createNewDiagram());

        userEvent.click(getComboboxByTestId('new-diagram-connection-selector'));
        expect(screen.getByText('Conn1')).to.exist;
        expect(screen.getByText('Conn2')).to.exist;

        userEvent.click(screen.getByText('Conn2'));
        expect(
          store.getState().generateDiagramWizard.formFields.selectedConnection
            .value
        ).to.eq('two');
      });

      it('shows error if it fails to connect', function () {
        const { store } = renderWithStore(<NewDiagramModal />, {
          services: {
            connections: {
              connect() {
                throw new Error('Can not connect');
              },
              getConnectionById(id: string) {
                return {
                  info: { id },
                };
              },
            } as any,
          },
        });

        store.dispatch(createNewDiagram());

        userEvent.click(getComboboxByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));

        expect(screen.queryByText(/Connection failed./)).to.exist;
      });
    });

    context('select-database', function () {
      it('shows list of databases and allows user to select one', async function () {
        const { store } = renderWithStore(<NewDiagramModal />);

        store.dispatch(createNewDiagram());

        userEvent.click(getComboboxByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));
        await waitFor(() => {
          expect(
            store.getState().generateDiagramWizard.formFields.selectedConnection
              .value
          ).to.equal('two');
        });

        userEvent.click(getComboboxByTestId('new-diagram-database-selector'));

        expect(screen.getByText('berlin')).to.exist;
        expect(screen.getByText('sample_airbnb')).to.exist;

        userEvent.click(screen.getByText('sample_airbnb'));
        expect(
          store.getState().generateDiagramWizard.formFields.selectedDatabase
            .value
        ).to.eq('sample_airbnb');
      });

      it('auto generates the name of a diagram', async function () {
        const { store } = renderWithStore(<NewDiagramModal />);
        await setSetupDiagramStep(store, {
          connection: { id: 'two', name: 'Conn2' },
          databaseName: 'sample_airbnb',
        });
        await waitFor(() => {
          // Not testing for exact date, but format
          expect(
            store.getState().generateDiagramWizard.formFields.diagramName.value
          ).to.match(/^sample_airbnb_\d{2}_\d{2}_\d{4}$/);
        });
      });

      it('shows error if it fails to fetch list of databases', async function () {
        const { store } = renderWithStore(<NewDiagramModal />, {
          services: {
            connections: {
              connect() {
                return Promise.resolve();
              },
              getConnectionById(id: string) {
                return {
                  info: { id },
                };
              },
              getDataServiceForConnection() {
                return {
                  listDatabases() {
                    throw new Error('Can not list databases');
                  },
                };
              },
            } as any,
          },
        });

        store.dispatch(createNewDiagram());

        userEvent.click(getComboboxByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));

        await waitFor(() => {
          expect(
            store.getState().generateDiagramWizard.formFields.selectedDatabase
              .error?.message
          ).to.equal('Can not list databases');
        });
        expect(screen.getByText(/Can not list databases/)).to.exist;
      });
    });

    it('allows to proceed to the next step if all fields are valid and have no errors', async function () {
      const { store } = renderWithStore(<NewDiagramModal />);

      await setSetupDiagramStep(store, {
        connection: { id: 'two', name: 'Conn2' },
        databaseName: 'sample_airbnb',
        diagramName: 'diagram1',
      });

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      await waitFor(() => {
        expect(store.getState().generateDiagramWizard.step).to.equal(
          'SELECT_COLLECTIONS'
        );
      });
    });
  });

  context('select-collections step', function () {
    it('shows list of collections', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      const { store } = renderWithStore(<NewDiagramModal />, {
        services: {
          preferences,
        },
      });
      await setSetupDiagramStep(store, {
        connection: { id: 'two', name: 'Conn2' },
        databaseName: 'sample_airbnb',
        diagramName: 'diagram1',
      });

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'SELECT_COLLECTIONS'
      );
      expect(
        store.getState().generateDiagramWizard.formFields.selectedCollections
          .value
      ).to.deep.equal(['listings', 'listingsAndReviews', 'reviews']);

      expect(screen.getByText('listings')).to.exist;
      expect(screen.getByText('listingsAndReviews')).to.exist;
      expect(screen.getByText('reviews')).to.exist;

      userEvent.click(
        screen.getByRole('button', {
          name: /generate/i,
        })
      );

      await waitFor(() => {
        expect(store.getState().generateDiagramWizard.inProgress).to.be.false;
      });
    });

    it('shows sample size input with default value of 100', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      const { store } = renderWithStore(<NewDiagramModal />, {
        services: {
          preferences,
        },
      });
      await setSetupDiagramStep(store, {
        connection: { id: 'two', name: 'Conn2' },
        databaseName: 'sample_airbnb',
        diagramName: 'diagram1',
      });

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      // Wait for the sample size input to appear (indicates SELECT_COLLECTIONS step)
      const sampleSizeInput = await screen.findByTestId('sample-size-input');
      expect(sampleSizeInput).to.have.value('100');
    });

    it('allows user to change sample size', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      const { store } = renderWithStore(<NewDiagramModal />, {
        services: {
          preferences,
        },
      });
      await setSetupDiagramStep(store, {
        connection: { id: 'two', name: 'Conn2' },
        databaseName: 'sample_airbnb',
        diagramName: 'diagram1',
      });

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      // Wait for the sample size input to appear
      const sampleSizeInput = await screen.findByTestId('sample-size-input');

      // The TextInput is nested inside a Radio component's Label, which
      // intercepts click events from userEvent. We use type() with skipClick
      // and manually position the cursor to type over the existing value.
      sampleSizeInput.focus();
      // Move cursor to end and delete existing content
      userEvent.type(sampleSizeInput, '{backspace}{backspace}{backspace}50', {
        skipClick: true,
      });

      await waitFor(() => {
        expect(sampleSizeInput).to.have.value('50');
      });
    });

    it('allows user to select all documents option', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      const { store } = renderWithStore(<NewDiagramModal />, {
        services: {
          preferences,
        },
      });
      await setSetupDiagramStep(store, {
        connection: { id: 'two', name: 'Conn2' },
        databaseName: 'sample_airbnb',
        diagramName: 'diagram1',
      });

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      // Wait for the select collections step
      await screen.findByTestId('sample-size-input');

      // Default should be sample size, not all documents
      expect(
        store.getState().generateDiagramWizard.samplingOptions.allDocuments
      ).to.be.false;

      // Click the "All documents" radio
      userEvent.click(screen.getByText('All documents'));

      await waitFor(() => {
        expect(
          store.getState().generateDiagramWizard.samplingOptions.allDocuments
        ).to.be.true;
      });

      // Shows a warning when all documents is selected
      expect(screen.getByTestId('sample-size-warning')).to.exist;
    });

    it('shows error if it fails to fetch list of collections', async function () {
      const { store } = renderWithStore(<NewDiagramModal />, {
        services: {
          connections: {
            connect() {
              return Promise.resolve();
            },
            getConnectionById(id: string) {
              return {
                info: { id },
              };
            },
            getDataServiceForConnection() {
              return {
                listDatabases() {
                  return [
                    {
                      _id: 'sample_airbnb',
                      name: 'sample_airbnb',
                    },
                  ];
                },
                listCollections() {
                  throw new Error('Can not list collections');
                },
              };
            },
          } as any,
        },
      });

      await setSetupDiagramStep(store, {
        connection: { id: 'two', name: 'Conn2' },
        databaseName: 'sample_airbnb',
        diagramName: 'diagram1',
      });

      // Next to trigger loading collections
      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      expect(
        store.getState().generateDiagramWizard.formFields.selectedCollections
          .error?.message
      ).to.equal('Can not list collections');
    });
  });
});
