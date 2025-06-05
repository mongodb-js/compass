import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import QueryFlowSection from './query-flow-section';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import { setupStore } from '../../../test/setup-store';
import { ActionTypes } from '../../modules/create-index';

describe('QueryFlowSection', () => {
  const store = setupStore();
  const dbName = 'fakeDBName';
  const collectionName = 'fakeCollectionName';
  const renderComponent = () => {
    render(
      <Provider store={store}>
        <QueryFlowSection
          schemaFields={[]}
          serverVersion="5.0.0"
          dbName={dbName}
          collectionName={collectionName}
          initialQuery={null}
        />
      </Provider>
    );
  };

  describe('in the initial state', () => {
    beforeEach(() => {
      renderComponent();
    });
    it('renders the input query section with a code editor', () => {
      const codeEditor = screen.getByTestId('query-flow-section-code-editor');
      expect(codeEditor).to.be.visible;
    });

    it('renders the "Show suggested index" button', () => {
      const buttonElement = screen.getByText('Show suggested index');
      expect(buttonElement).to.be.visible;
    });
    it('does not render the suggested index section with formatted index code', () => {
      const codeElement = screen.queryByTestId(
        'query-flow-section-suggested-index'
      );
      expect(codeElement).to.be.null;
    });
  });

  describe('when fetching for index suggestions', () => {
    beforeEach(() => {
      renderComponent();

      store.dispatch({
        type: ActionTypes.SuggestedIndexesRequested,
      });
    });
    it('renders a loader for the code section', () => {
      const loader = screen.getByTestId('query-flow-section-code-loader');
      expect(loader).to.be.visible;
    });
  });

  describe('when index suggestions is fetched', () => {
    beforeEach(() => {
      renderComponent();

      store.dispatch({
        type: ActionTypes.SuggestedIndexesFetched,
        sampleDocs: [],
        indexSuggestions: { a: 1, b: 2 },
        error: null,
        indexSuggestionsState: 'success',
      });
    });

    it('renders the suggested index section with formatted index code', () => {
      const codeElement = screen.getByTestId(
        'query-flow-section-suggested-index'
      );
      expect(codeElement).to.be.visible;
      expect(codeElement).to.have.text(
        `db.getSiblingDB("${dbName}").getCollection("${collectionName}").createIndex({  "a": 1,  "b": "2"});`
      );
    });
  });
});
