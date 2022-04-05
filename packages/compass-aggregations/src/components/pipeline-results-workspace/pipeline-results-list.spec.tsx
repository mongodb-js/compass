import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import PipelineResultsList from './pipeline-results-list';

describe('PipelineResultsList', function () {
  it('does not render when documents are empty', function () {
    render(<PipelineResultsList documents={[]} view="document" />);
    expect(() => {
      screen.getByTestId('document-list-item');
    }).to.throw;
  });

  it.skip('renders list view', function () {
    render(
      <PipelineResultsList documents={[{ id: 1 }, { id: 2 }]} view="document" />
    );
    expect(screen.getAllByTestId('document-list-item')).to.have.lengthOf(2);
  });

  it.skip('renders json view', function () {
    render(
      <PipelineResultsList
        documents={[{ id: 3 }, { id: 4 }, { id: 5 }]}
        view="json"
      />
    );
    expect(screen.getAllByTestId('document-json-item')).to.have.lengthOf(3);
  });
});
