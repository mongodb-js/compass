import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import QueryFlowSection from './query-flow-section';
import { expect } from 'chai';

describe('QueryFlowSection', () => {
  const renderComponent = () => {
    render(
      <QueryFlowSection
        schemaFields={[]}
        serverVersion="5.0.0"
        dbName={'fakeDBName'}
        collectionName={'fakeCollectionName'}
      />
    );
  };
  it('renders the input query section with a code editor', () => {
    renderComponent();
    const codeEditor = screen.getByTestId('query-flow-section-code-editor');
    expect(codeEditor).to.be.visible;
  });

  it('renders the "Show suggested index" button', () => {
    renderComponent();
    const buttonElement = screen.getByText('Show suggested index');
    expect(buttonElement).to.be.visible;
  });

  it('renders the suggested index section with formatted index code', () => {
    renderComponent();
    const codeElement = screen.getByTestId(
      'query-flow-section-suggested-index'
    );
    expect(codeElement).to.be.visible;
  });
});
