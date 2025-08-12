import React from 'react';
import { expect } from 'chai';
import {
  createPluginTestHelpers,
  screen,
  waitFor,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';
import { DataModelingWorkspaceTab } from '../../index';
import DiagramEditorSidePanel from './diagram-editor-side-panel';
import {
  openDiagram,
  selectCollection,
  selectCurrentModelFromState,
  selectRelationship,
} from '../../store/diagram';
import dataModel from '../../../test/fixtures/data-model-with-relationships.json';
import type {
  MongoDBDataModelDescription,
  DataModelCollection,
  Relationship,
} from '../../services/data-model-storage';
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

  it('should render and edit a collection in collection context drawer when collection is clicked', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(selectCollection('flights.airlines'));

    await waitFor(() => {
      expect(screen.getByTitle('flights.airlines')).to.be.visible;
    });

    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).to.be.visible;
    expect(nameInput).to.have.value('airlines');

    userEvent.click(screen.getByRole('textbox', { name: 'Notes' }));
    userEvent.type(
      screen.getByRole('textbox', { name: 'Notes' }),
      'Note about the collection'
    );
    userEvent.tab();

    const modifiedCollection = selectCurrentModelFromState(
      result.plugin.store.getState()
    ).collections.find((coll) => {
      return coll.ns === 'flights.airlines';
    });

    expect(modifiedCollection).to.have.property(
      'note',
      'Note about the collection'
    );
  });

  it('should render a relationship context drawer when relations is clicked', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(
      selectRelationship('204b1fc0-601f-4d62-bba3-38fade71e049')
    );

    await waitFor(() => {
      expect(screen.getByTitle('countries.name → airports.Country')).to.be
        .visible;
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
      expect(screen.getByLabelText('Name')).to.have.value('airlines');
    });

    result.plugin.store.dispatch(
      selectCollection('flights.airports_coordinates_for_schema')
    );
    expect(screen.getByLabelText('Name')).to.have.value(
      'airports_coordinates_for_schema'
    );

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
    expect(screen.getByLabelText('Name')).to.have.value('planes');
  });

  it('should open and edit relationship starting from collection', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(selectCollection('flights.countries'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).to.have.value('countries');
    });

    // Open relationshipt editing form
    const relationshipItem = screen
      .getByText('countries.name → airports.Country')
      .closest('li');
    expect(relationshipItem).to.be.visible;
    userEvent.click(
      within(relationshipItem!).getByRole('button', {
        name: 'Edit relationship',
      })
    );
    expect(screen.getByLabelText('Local field')).to.be.visible;

    // Select new values
    await comboboxSelectItem('Local collection', 'planes');
    await comboboxSelectItem('Local field', 'name');
    await comboboxSelectItem('Foreign collection', 'countries');
    await comboboxSelectItem('Foreign field', 'iso_code');

    userEvent.click(screen.getByRole('textbox', { name: 'Notes' }));
    userEvent.type(
      screen.getByRole('textbox', { name: 'Notes' }),
      'Note about the relationship'
    );
    userEvent.tab();

    // We should be testing through rendered UI but as it's really hard to make
    // diagram rendering in tests property, we are just validating the final
    // model here
    const modifiedRelationship = selectCurrentModelFromState(
      result.plugin.store.getState()
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

    expect(modifiedRelationship).to.have.property(
      'note',
      'Note about the relationship'
    );
  });

  it('should delete a relationship from collection', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(selectCollection('flights.countries'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).to.have.value('countries');
    });

    // Find the relationhip item
    const relationshipItem = screen
      .getByText('countries.name → airports.Country')
      .closest('li');
    expect(relationshipItem).to.be.visible;

    // Delete relationship
    userEvent.click(
      within(relationshipItem!).getByRole('button', {
        name: 'Delete relationship',
      })
    );

    await waitFor(() => {
      expect(screen.queryByText('countries.name → airports.Country')).not.to
        .exist;
    });
  });

  it('should open and edit a collection name', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(selectCollection('flights.countries'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).to.have.value('countries');
    });

    // Update the name.
    userEvent.clear(screen.getByLabelText('Name'));
    userEvent.type(screen.getByLabelText('Name'), 'pineapple');

    // Blur/unfocus the input.
    userEvent.click(document.body);

    // Check the name in the model.
    const modifiedCollection = selectCurrentModelFromState(
      result.plugin.store.getState()
    ).collections.find((c: DataModelCollection) => {
      return c.ns === 'flights.pineapple';
    });

    expect(modifiedCollection).to.exist;
  });

  it('should prevent editing to an empty collection name', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(selectCollection('flights.countries'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).to.have.value('countries');
      expect(screen.getByLabelText('Name')).to.have.attribute(
        'aria-invalid',
        'false'
      );
    });

    userEvent.clear(screen.getByLabelText('Name'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).to.have.attribute(
        'aria-invalid',
        'true'
      );
    });

    // Blur/unfocus the input.
    userEvent.click(document.body);

    const notModifiedCollection = selectCurrentModelFromState(
      result.plugin.store.getState()
    ).collections.find((c: DataModelCollection) => {
      return c.ns === 'flights.countries';
    });

    expect(notModifiedCollection).to.exist;
  });

  it('should prevent editing to a duplicate collection name', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(selectCollection('flights.countries'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).to.have.value('countries');
      expect(screen.getByLabelText('Name')).to.have.attribute(
        'aria-invalid',
        'false'
      );
    });

    userEvent.clear(screen.getByLabelText('Name'));
    userEvent.type(screen.getByLabelText('Name'), 'airlines');

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).to.have.attribute(
        'aria-invalid',
        'true'
      );
    });

    // Blur/unfocus the input.
    userEvent.click(document.body);

    const notModifiedCollection = selectCurrentModelFromState(
      result.plugin.store.getState()
    ).collections.find((c: DataModelCollection) => {
      return c.ns === 'flights.countries';
    });

    expect(notModifiedCollection).to.exist;
  });
});
