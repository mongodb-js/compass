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

const storageItems: MongoDBDataModelDescription[] = [
  {
    id: '1',
    name: 'One',
    edits: [],
    connectionId: null,
  },
  {
    id: '2',
    name: 'Two',
    edits: [
      {
        type: 'SetModel',
        model: {
          collections: [
            {
              ns: 'db2.collection2',
              indexes: [],
              displayPosition: [0, 0],
              shardKey: {},
              jsonSchema: { bsonType: 'object' },
            },
          ],
          relationships: [],
        },
      },
    ],
    connectionId: null,
  },
  {
    id: '3',
    name: 'Three',
    edits: [],
    connectionId: null,
  },
];

const renderSavedDiagramsList = ({
  items = storageItems,
}: {
  items?: MongoDBDataModelDescription[];
} = {}) => {
  const mockDataModelStorage = {
    status: 'READY',
    error: null,
    items,
    save: () => {
      return Promise.resolve(false);
    },
    delete: () => {
      return Promise.resolve(false);
    },
    loadAll: () => Promise.resolve(items),
    load: (id: string) => {
      return Promise.resolve(items.find((x) => x.id === id) ?? null);
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

describe('SavedDiagramsList', function () {
  context('when there are no saved diagrams', function () {
    let store: DataModelingStore;

    beforeEach(async function () {
      const result = renderSavedDiagramsList({ items: [] });
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
      const result = renderSavedDiagramsList();
      store = result.store;

      // wait till the list is loaded
      await waitFor(() => {
        expect(screen.getByTestId('saved-diagram-list')).to.be.visible;
      });
    });

    it('shows the list of diagrams', async function () {
      await waitFor(() => {
        expect(screen.getByText('One')).to.exist;
        expect(screen.getByText('Two')).to.exist;
        expect(screen.getByText('Three')).to.exist;
      });
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

    describe('search', function () {
      it('filters the list of diagrams by name', async function () {
        const searchInput = screen.getByPlaceholderText('Search');
        userEvent.type(searchInput, 'One');
        await waitFor(() => {
          expect(screen.queryByText('One')).to.exist;
        });

        await waitFor(() => {
          expect(screen.queryByText('Two')).to.not.exist;
          expect(screen.queryByText('Three')).to.not.exist;
        });
      });

      it('filters the list of diagrams by database', async function () {
        const searchInput = screen.getByPlaceholderText('Search');
        userEvent.type(searchInput, 'db2');
        await waitFor(() => {
          expect(screen.queryByText('Two')).to.exist;
        });

        await waitFor(() => {
          expect(screen.queryByText('One')).to.not.exist;
          expect(screen.queryByText('Three')).to.not.exist;
        });
      });

      it('shows empty content when filter for a non-existent diagram', async function () {
        const searchInput = screen.getByPlaceholderText('Search');
        userEvent.type(searchInput, 'Hello');
        await waitFor(() => {
          expect(screen.queryByText('No results found.')).to.exist;
          expect(
            screen.queryByText(
              "We can't find any diagram matching your search."
            )
          ).to.exist;
        });

        await waitFor(() => {
          expect(screen.queryByText('One')).to.not.exist;
          expect(screen.queryByText('Two')).to.not.exist;
          expect(screen.queryByText('Three')).to.not.exist;
        });
      });
    });
  });
});
