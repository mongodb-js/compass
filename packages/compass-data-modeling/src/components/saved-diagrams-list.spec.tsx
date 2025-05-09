import React from 'react';
import { expect } from 'chai';
import {
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import SavedDiagramsList from './saved-diagrams-list';
import { renderWithStore } from '../../test/setup-store';
import type { DataModelingStore } from '../../test/setup-store';
import { DataModelStorageServiceProvider } from '../provider';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';

describe('SavedDiagramsList', function () {
  const renderSavedDiagramsList = ({
    loadAll = () => Promise.resolve([]),
  }: {
    loadAll?: () => Promise<MongoDBDataModelDescription[]>;
  } = {}) => {
    const mockDataModelStorage = {
      status: 'READY',
      error: null,
      items: [],
      save: () => {
        return Promise.resolve(false);
      },
      delete: () => {
        return Promise.resolve(false);
      },
      loadAll,
      load: () => {
        return Promise.resolve(null);
      },
    };
    return renderWithStore(
      <DataModelStorageServiceProvider storage={mockDataModelStorage}>
        <SavedDiagramsList />
      </DataModelStorageServiceProvider>,
      {
        services: {
          dataModelStorage: mockDataModelStorage,
        },
      }
    );
  };

  context('when there are no saved diagrams', function () {
    let store: DataModelingStore;

    beforeEach(async function () {
      const result = renderSavedDiagramsList();
      store = result.store;

      // wait till the empty list is loaded
      await waitFor(() => {
        expect(screen.getByTestId('empty-content')).to.be.visible;
      });
    });

    it('shows the empty state', function () {
      expect(
        screen.getByText('Design, Visualize, and Evolve your Data Model')
      ).to.be.visible;
    });

    it('allows to start adding diagrams', function () {
      const createDiagramButton = screen.getByRole('button', {
        name: 'Generate diagram',
      });
      expect(store.getState().generateDiagramWizard.inProgress).to.be.false;
      expect(createDiagramButton).to.be.visible;
      userEvent.click(createDiagramButton);
      expect(store.getState().generateDiagramWizard.inProgress).to.be.true;
    });
  });

  context('when there are diagrams', function () {
    let store: DataModelingStore;

    beforeEach(async function () {
      const result = renderSavedDiagramsList({
        loadAll: () =>
          Promise.resolve([
            {
              id: 'diagram-1',
              name: 'Diagram 1',
            } as MongoDBDataModelDescription,
          ]),
      });
      store = result.store;

      // wait till the list is loaded
      await waitFor(() => {
        expect(screen.getByTestId('saved-diagram-list')).to.be.visible;
      });
    });

    it('shows the list of diagrams', function () {
      expect(screen.getByText('Diagram 1')).to.exist;
    });

    it('allows to add another diagram', function () {
      const createDiagramButton = screen.getByRole('button', {
        name: 'Generate new diagram',
      });
      expect(store.getState().generateDiagramWizard.inProgress).to.be.false;
      expect(createDiagramButton).to.be.visible;
      userEvent.click(createDiagramButton);
      expect(store.getState().generateDiagramWizard.inProgress).to.be.true;
    });
  });
});
