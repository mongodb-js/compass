import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import PipelineResultsList from './pipeline-results-list';

describe('PipelineResultsList', function () {
  it('does not render when documents are empty', function () {
    render(
      <PipelineResultsList
        allDocsExpanded={false}
        documents={[]}
        view="document"
      />
    );
    expect(() => {
      screen.getByTestId('document-list-item');
    }).to.throw;
  });

  it('renders list view', function () {
    render(
      <PipelineResultsList
        allDocsExpanded={false}
        documents={[{ id: 1 }, { id: 2 }]}
        view="document"
      />
    );
    expect(
      document.querySelectorAll('[data-testid="document-list-item"]')
    ).to.have.lengthOf(2);
  });

  it('renders json view', function () {
    render(
      <PipelineResultsList
        allDocsExpanded={false}
        documents={[{ id: 3 }, { id: 4 }, { id: 5 }]}
        view="json"
      />
    );
    expect(
      document.querySelectorAll('[data-testid="document-json-item"]')
    ).to.have.lengthOf(3);
  });
});
