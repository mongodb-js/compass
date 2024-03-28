import React, { type ComponentProps } from 'react';
import HadronDocument from 'hadron-document';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import PipelineResultsList from './pipeline-results-list';
import { ConnectionInfoProvider } from '@mongodb-js/connection-storage/provider';

function renderPipelineResultsList(
  props?: Partial<ComponentProps<typeof PipelineResultsList>>
) {
  render(
    <ConnectionInfoProvider
      value={{
        id: '1234',
        connectionOptions: {
          connectionString: 'mongodb://webscales.com:27017',
        },
      }}
    >
      <PipelineResultsList
        namespace="test.test"
        documents={[]}
        view="document"
        {...props}
      />
    </ConnectionInfoProvider>
  );
}

describe('PipelineResultsList', function () {
  it('does not render when documents are empty', function () {
    renderPipelineResultsList();
    expect(() => {
      screen.getByTestId('document-list-item');
    }).to.throw;
  });

  it('renders list view', function () {
    renderPipelineResultsList({
      documents: [new HadronDocument({ id: 1 }), new HadronDocument({ id: 2 })],
    });
    expect(
      document.querySelectorAll('[data-testid="document-list-item"]')
    ).to.have.lengthOf(2);
  });

  it('renders json view', function () {
    renderPipelineResultsList({
      documents: [
        new HadronDocument({ id: 3 }),
        new HadronDocument({ id: 4 }),
        new HadronDocument({ id: 5 }),
      ],
      view: 'json',
    });
    expect(
      document.querySelectorAll('[data-testid="document-json-item"]')
    ).to.have.lengthOf(3);
  });
});
