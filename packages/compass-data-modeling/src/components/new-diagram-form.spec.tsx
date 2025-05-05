import React from 'react';
import type { ComponentProps } from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { NewDiagramForm } from './new-diagram-form';

function noop() {
  // no op
}
function renderNewDiagramForm(
  props: Partial<ComponentProps<typeof NewDiagramForm>>
) {
  return render(
    <NewDiagramForm
      collections={[]}
      databases={[]}
      diagramName=""
      error={null}
      formStep="enter-name"
      isLoading={false}
      isModalOpen={true}
      selectedDatabase={null}
      selectedCollections={[]}
      selectedConnectionId={null}
      onCancel={noop}
      onCollectionsSelect={noop}
      onCollectionsSelectionConfirm={noop}
      onConnectionConfirmSelection={noop}
      onConnectionSelect={noop}
      onConnectionSelectCancel={noop}
      onDatabaseConfirmSelection={noop}
      onDatabaseSelect={noop}
      onDatabaseSelectCancel={noop}
      onNameChange={noop}
      onNameConfirm={noop}
      onNameConfirmCancel={noop}
      {...props}
    />
  );
}

describe('NewDiagramForm', function () {
  context('it renders errors at the step', function () {
    it('renders error when selecting a connection', function () {
      renderNewDiagramForm({
        formStep: 'select-connection',
        error: new Error('Can not connect.'),
      });
      expect(screen.getByText('Can not connect.')).to.exist;
    });

    it('renders error when selecting a database', function () {
      renderNewDiagramForm({
        formStep: 'select-database',
        error: new Error('Can not fetch databases.'),
      });
      expect(screen.getByText('Can not fetch databases.')).to.exist;
    });

    it('renders error when selecting collections', function () {
      renderNewDiagramForm({
        formStep: 'select-collections',
        error: new Error('Can not fetch collections.'),
      });
      expect(screen.getByText('Can not fetch collections.')).to.exist;
    });
  });
});
