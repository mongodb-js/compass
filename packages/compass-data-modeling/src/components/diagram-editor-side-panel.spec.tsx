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
import type {
  MongoDBDataModelDescription,
  Relationship,
} from '../services/data-model-storage';
import { DrawerAnchor } from '@mongodb-js/compass-components';

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

describe('DiagramEditorSidePanel', function () {
  before(function () {
    // TODO(COMPASS-9618): skip in electron runtime for now, drawer has issues rendering
    if ((process as any).type === 'renderer') {
      this.skip();
    }
  });

  function renderDrawer() {
    const { renderWithConnections } = createPluginTestHelpers(
      DataModelingWorkspaceTab.provider.withMockServices({})
    );
    const result = renderWithConnections(
      <DrawerAnchor>
        <DiagramEditorSidePanel></DiagramEditorSidePanel>
      </DrawerAnchor>
    );
    result.plugin.store.dispatch(
      openDiagram(dataModel as MongoDBDataModelDescription)
    );
    return result;
  }

  it('should not render if no items are selected', function () {
    renderDrawer();
    expect(screen.queryByTestId('data-modeling-drawer')).to.eq(null);
  });

  it('should render a collection context drawer when collection is clicked', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(selectCollection('flights.airlines'));

    await waitFor(() => {
      expect(screen.getByText('flights.airlines')).to.be.visible;
    });
  });

  it('should render a relationship context drawer when relations is clicked', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(
      selectRelationship('204b1fc0-601f-4d62-bba3-38fade71e049')
    );

    await waitFor(() => {
      const name = screen.getByLabelText('Name');
      expect(name).to.be.visible;
      expect(name).to.have.value('Airport Country');
    });

    const localCollectionInput = screen.getByLabelText('Local collection');
    expect(localCollectionInput).to.be.visible;
    expect(localCollectionInput).to.have.value('countries');

    const foreignCollectionInput = screen.getByLabelText('Foreign collection');
    expect(foreignCollectionInput).to.be.visible;
    expect(foreignCollectionInput).to.have.value('airports');

    const localFieldInput = screen.getByLabelText('Local field');
    expect(localFieldInput).to.be.visible;
    expect(localFieldInput).to.have.value('name');

    const foreignFieldInput = screen.getByLabelText('Foreign field');
    expect(foreignFieldInput).to.be.visible;
    expect(foreignFieldInput).to.have.value('Country');

    const localCardinalityInput = screen.getByLabelText('Local cardinality');
    expect(localCardinalityInput).to.be.visible;
    expect(localCardinalityInput).to.have.value('1');

    const foreignCardinalityInput = screen.getByLabelText(
      'Foreign cardinality'
    );
    expect(foreignCardinalityInput).to.be.visible;
    expect(foreignCardinalityInput).to.have.value('100');

    expect(
      document.querySelector(
        '[data-relationship-id="204b1fc0-601f-4d62-bba3-38fade71e049"]'
      )
    ).to.be.visible;
  });

  it('should change the content of the drawer when selecting different items', async function () {
    const result = renderDrawer();

    result.plugin.store.dispatch(selectCollection('flights.airlines'));

    await waitFor(() => {
      expect(screen.getByText('flights.airlines')).to.be.visible;
    });

    result.plugin.store.dispatch(
      selectCollection('flights.airports_coordinates_for_schema')
    );
    expect(screen.getByText('flights.airports_coordinates_for_schema')).to.be
      .visible;

    result.plugin.store.dispatch(
      selectRelationship('204b1fc0-601f-4d62-bba3-38fade71e049')
    );
    expect(
      document.querySelector(
        '[data-relationship-id="204b1fc0-601f-4d62-bba3-38fade71e049"]'
      )
    ).to.be.visible;

    result.plugin.store.dispatch(
      selectRelationship('6f776467-4c98-476b-9b71-1f8a724e6c2c')
    );
    expect(
      document.querySelector(
        '[data-relationship-id="6f776467-4c98-476b-9b71-1f8a724e6c2c"]'
      )
    ).to.be.visible;

    result.plugin.store.dispatch(selectCollection('flights.planes'));
    expect(screen.getByText('flights.planes')).to.be.visible;
  });

  it('should open and edit relationship starting from collection', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(selectCollection('flights.countries'));

    await waitFor(() => {
      expect(screen.getByText('flights.countries')).to.be.visible;
    });

    // Open relationshipt editing form
    const relationshipCard = document.querySelector<HTMLElement>(
      '[data-relationship-id="204b1fc0-601f-4d62-bba3-38fade71e049"]'
    );
    userEvent.click(
      within(relationshipCard!).getByRole('button', { name: 'Edit' })
    );
    expect(screen.getByLabelText('Local field')).to.be.visible;

    // Select new values
    await comboboxSelectItem('Local collection', 'planes');
    await comboboxSelectItem('Local field', 'name');
    await comboboxSelectItem('Foreign collection', 'countries');
    await comboboxSelectItem('Foreign field', 'iso_code');

    // We should be testing through rendered UI but as it's really hard to make
    // diagram rendering in tests property, we are just validating the final
    // model here
    const modifiedRelationship = selectCurrentModel(
      getCurrentDiagramFromState(result.plugin.store.getState()).edits
    ).relationships.find((r: Relationship) => {
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
          cardinality: 100,
        },
      ]);
  });
});
