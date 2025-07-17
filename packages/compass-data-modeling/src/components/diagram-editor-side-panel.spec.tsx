import React from 'react';
import { expect } from 'chai';
import {
  createPluginTestHelpers,
  screen,
  waitFor,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';
import { DataModelingWorkspaceTab } from '../index';
import DiagramEditorSidePanel from './diagram-editor-side-panel';
import {
  getCurrentDiagramFromState,
  openDiagram,
  selectCollection,
  selectCurrentModel,
  selectRelationship,
} from '../store/diagram';
import dataModel from '../../test/fixtures/data-model-with-relationships.json';

async function comboboxSelectItem(
  label: string,
  value: string,
  visibleLabel = value
) {
  userEvent.click(screen.getByRole('textbox', { name: label }));
  await waitFor(() => {
    screen.getByRole('option', { name: visibleLabel });
  });
  userEvent.click(screen.getByRole('option', { name: visibleLabel }));
  await waitFor(() => {
    expect(screen.getByRole('textbox', { name: label })).to.have.attribute(
      'value',
      value
    );
  });
}

describe.only('DiagramEditorSidePanel', function () {
  function renderDrawer() {
    const { renderWithConnections } = createPluginTestHelpers(
      DataModelingWorkspaceTab.provider.withMockServices({})
    );
    const result = renderWithConnections(
      <DiagramEditorSidePanel></DiagramEditorSidePanel>
    );
    result.plugin.store.dispatch(openDiagram(dataModel));
    return result;
  }

  it('should not render if no items are selected', function () {
    renderDrawer();
  });

  it('should render a collection context drawer when collection is clicked', async function () {
    const result = renderDrawer();
    await result.plugin.store.dispatch(selectCollection('flights.airlines'));
    expect(screen.getByText('flights.airlines')).to.be.visible;
  });

  it('should render a relationship context drawer when relations is clicked', async function () {
    const result = renderDrawer();
    await result.plugin.store.dispatch(
      selectRelationship('204b1fc0-601f-4d62-bba3-38fade71e049')
    );
    expect(screen.getByText('Edit Relationship')).to.be.visible;
    expect(
      document.querySelector(
        '[data-relationship-id="204b1fc0-601f-4d62-bba3-38fade71e049"]'
      )
    ).to.exist;
  });

  it('should open and edit relationship starting from collection', async function () {
    const result = renderDrawer();
    await result.plugin.store.dispatch(selectCollection('flights.countries'));

    // Open relationshipt editing form
    const relationshipCard = document.querySelector<HTMLElement>(
      '[data-relationship-id="204b1fc0-601f-4d62-bba3-38fade71e049"]'
    );
    userEvent.click(
      within(relationshipCard!).getByRole('button', { name: 'Edit' })
    );
    expect(screen.getByText('Edit Relationship')).to.be.visible;

    // Select new values
    await comboboxSelectItem('Local collection', 'planes');
    await comboboxSelectItem('Local field', 'name');
    await comboboxSelectItem('Foreign collection', 'countries');
    await comboboxSelectItem('Foreign field', 'iso_code');

    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    // We should be testing through rendered UI but as it's really hard to make
    // diagram rendering in tests property, we are just validating the final
    // model here
    const modifiedRelationship = selectCurrentModel(
      getCurrentDiagramFromState(result.plugin.store.getState()).edits
    ).relationships.find((r) => {
      return r.id === '204b1fc0-601f-4d62-bba3-38fade71e049';
    });

    expect(modifiedRelationship)
      .to.have.property('relationship')
      .deep.eq([
        {
          ns: 'flights.planes',
          fields: ['name'],
          cardinality: 1,
        },
        {
          ns: 'flights.countries',
          fields: ['iso_code'],
          cardinality: 1,
        },
      ]);

    // After saving when starting from collection, we should end up back in the
    // collection drawer that we started from
    expect(screen.getByText('flights.countries')).to.be.visible;
  });
});
