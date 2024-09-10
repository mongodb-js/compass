import React from 'react';
import HadronDocument from 'hadron-document';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import PipelineResultsList from './pipeline-results-list';

describe('PipelineResultsList', function () {
  it('does not render when documents are empty', function () {
    render(
      <PipelineResultsList
        namespace="test.test"
        documents={[]}
        view="document"
      />
    );
    expect(() => {
      screen.getByTestId('document-list-item');
    }).to.throw();
  });

  it('renders list view', function () {
    render(
      <PipelineResultsList
        namespace="test.test"
        documents={[
          new HadronDocument({ id: 1 }),
          new HadronDocument({ id: 2 }),
        ]}
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
        namespace="test.test"
        documents={[
          new HadronDocument({ id: 3 }),
          new HadronDocument({ id: 4 }),
          new HadronDocument({ id: 5 }),
        ]}
        view="json"
      />
    );
    expect(
      document.querySelectorAll('[data-testid="document-json-item"]')
    ).to.have.lengthOf(3);
  });
});
