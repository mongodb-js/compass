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
  addCollection,
  openDiagram,
  selectCollection,
  selectCurrentModelFromState,
  selectRelationship,
  selectField,
} from '../../store/diagram';
import dataModel from '../../../test/fixtures/data-model-with-relationships.json';
import type {
  MongoDBDataModelDescription,
  DataModelCollection,
  Relationship,
} from '../../services/data-model-storage';
import { DrawerAnchor, getDrawerIds } from '@mongodb-js/compass-components';

const drawerTestId = getDrawerIds().root;

const waitForDrawerToOpen = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId(drawerTestId)).to.have.attribute(
      'aria-hidden',
      'false'
    );
  });
};

const updateInputWithBlur = (label: string, text: string) => {
  const input = screen.getByLabelText(label);
  userEvent.clear(input);
  if (text.length) userEvent.type(input, text);

  // Blur/unfocus the input.
  userEvent.click(document.body);
};

const updateInputWithEnter = (label: string, text: string) => {
  const input = screen.getByLabelText(label);
  userEvent.clear(input);
  if (text.length) userEvent.type(input, text);
  userEvent.type(input, '{enter}');
};

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

async function multiComboboxToggleItem(
  label: string,
  value: string,
  visibleLabel = value
) {
  userEvent.click(screen.getByRole('textbox', { name: label }));
  await waitFor(() => {
    const listbox = screen.getByRole('listbox');
    expect(listbox).to.be.visible;
    const option = within(listbox).getByRole('option', { name: visibleLabel });
    userEvent.click(option);
  });
}

function getMultiComboboxValues(testId: string) {
  const combobox = screen.getByTestId(testId);
  expect(combobox).to.be.visible;
  return within(combobox)
    .getAllByRole('option')
    .map((option) => option.textContent);
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
    expect(screen.queryByTestId(drawerTestId)).to.have.attribute(
      'aria-hidden',
      'true'
    );
  });

  it('should render a relationship context drawer when relations is clicked', async function () {
    const result = renderDrawer();
    result.plugin.store.dispatch(
      selectRelationship('204b1fc0-601f-4d62-bba3-38fade71e049')
    );

    await waitForDrawerToOpen();

    expect(screen.getByTitle('countries.name → airports.Country')).to.be
      .visible;
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

  describe('When a field is selected', function () {
    it('should render a field context drawer', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(selectField('flights.airlines', ['alias']));

      await waitForDrawerToOpen();
      expect(screen.getByTitle('airlines.alias')).to.be.visible;

      const nameInput = screen.getByLabelText('Field name');
      expect(nameInput).to.be.visible;
      expect(nameInput).to.have.value('alias');

      const selectedTypes = getMultiComboboxValues('lg-combobox-datatype');
      expect(selectedTypes).to.have.lengthOf(2);
      expect(selectedTypes).to.include('string');
      expect(selectedTypes).to.include('int');
    });

    it('should render a nested field context drawer', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(
        selectField('flights.routes', ['airline', '_id'])
      );

      await waitForDrawerToOpen();
      expect(screen.getByTitle('routes.airline._id')).to.be.visible;

      const nameInput = screen.getByLabelText('Field name');
      expect(nameInput).to.be.visible;
      expect(nameInput).to.have.value('_id');

      const selectedTypes = getMultiComboboxValues('lg-combobox-datatype');
      expect(selectedTypes).to.have.lengthOf(1);
      expect(selectedTypes).to.include('string');
    });

    it('should delete a field', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(
        selectField('flights.routes', ['airline', '_id'])
      );

      await waitForDrawerToOpen();
      expect(screen.getByTitle('routes.airline._id')).to.be.visible;

      userEvent.click(screen.getByLabelText(/delete field/i));

      await waitFor(() => {
        expect(screen.queryByText('routes.airline._id')).not.to.exist;
      });
      expect(screen.queryByLabelText('Name')).to.not.exist;

      const modifiedCollection = selectCurrentModelFromState(
        result.plugin.store.getState()
      ).collections.find((coll) => {
        return coll.ns === 'flights.routes';
      });

      expect(
        modifiedCollection?.jsonSchema.properties?.airline.properties
      ).to.not.have.property('_id'); // deleted field
      expect(
        modifiedCollection?.jsonSchema.properties?.airline.properties
      ).to.have.property('name'); // sibling field remains
    });

    it('should rename a field and keep it selected', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(
        selectField('flights.routes', ['airline', 'name'])
      );

      await waitForDrawerToOpen();
      expect(screen.getByTitle('routes.airline.name')).to.be.visible;

      updateInputWithBlur('Field name', 'new_name');

      await waitFor(() => {
        expect(screen.queryByText('routes.airline.name')).not.to.exist;
        expect(screen.queryByText('routes.airline.new_name')).to.exist;
      });
    });

    it('should not rename a field to an empty string', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(
        selectField('flights.routes', ['airline', 'name'])
      );

      await waitForDrawerToOpen();
      expect(screen.getByTitle('routes.airline.name')).to.be.visible;

      updateInputWithBlur('Field name', '');

      await waitFor(() => {
        expect(screen.queryByText('Field name cannot be empty.')).to.exist;
        expect(screen.queryByText('routes.airline.name')).to.exist;
      });
    });

    it('should not rename a field to a duplicate', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(
        selectField('flights.routes', ['airline', 'name'])
      );

      await waitForDrawerToOpen();
      expect(screen.getByTitle('routes.airline.name')).to.be.visible;

      updateInputWithBlur('Field name', '_id');

      await waitFor(() => {
        expect(screen.queryByText('Field already exists.')).to.exist;
        expect(screen.queryByText('routes.airline.name')).to.exist;
      });
    });

    it('should change the field type', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(
        selectField('flights.routes', ['airline', 'name'])
      );

      await waitForDrawerToOpen();
      expect(screen.getByTitle('routes.airline.name')).to.be.visible;

      // before - string
      const selectedTypesBefore = getMultiComboboxValues(
        'lg-combobox-datatype'
      );
      expect(selectedTypesBefore).to.have.members(['string']);

      // add int and bool and remove string
      await multiComboboxToggleItem('Datatype', 'int');
      await multiComboboxToggleItem('Datatype', 'bool');
      await multiComboboxToggleItem('Datatype', 'string');

      const modifiedCollection = selectCurrentModelFromState(
        result.plugin.store.getState()
      ).collections.find((coll) => {
        return coll.ns === 'flights.routes';
      });
      expect(
        modifiedCollection?.jsonSchema.properties?.airline?.properties?.name
          .bsonType
      ).to.have.members(['int', 'bool']);
    });

    it('should not completely remove the type', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(
        selectField('flights.routes', ['airline', 'name'])
      );

      await waitForDrawerToOpen();
      expect(screen.getByTitle('routes.airline.name')).to.be.visible;

      // before - string
      const selectedTypesBefore = getMultiComboboxValues(
        'lg-combobox-datatype'
      );
      expect(selectedTypesBefore).to.have.members(['string']);

      // remove string without adding anything else
      await multiComboboxToggleItem('Datatype', 'string');

      await waitFor(() => {
        // error message shown
        expect(screen.queryByText('Field must have a type.')).to.exist;
        const modifiedCollection = selectCurrentModelFromState(
          result.plugin.store.getState()
        ).collections.find((coll) => {
          return coll.ns === 'flights.routes';
        });
        // type remains unchanged
        expect(
          modifiedCollection?.jsonSchema.properties?.airline?.properties?.name
            .bsonType
        ).to.equal('string');
      });

      // finally, add some types
      await multiComboboxToggleItem('Datatype', 'bool');
      await multiComboboxToggleItem('Datatype', 'int');

      await waitFor(() => {
        // error goes away
        expect(screen.queryByText('Field must have a type.')).not.to.exist;
        const modifiedCollection = selectCurrentModelFromState(
          result.plugin.store.getState()
        ).collections.find((coll) => {
          return coll.ns === 'flights.routes';
        });
        // new type applied
        expect(
          modifiedCollection?.jsonSchema.properties?.airline?.properties?.name
            .bsonType
        ).to.have.members(['bool', 'int']);
      });
    });

    it('top level _id field is treated as readonly', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(selectField('flights.routes', ['_id']));

      await waitForDrawerToOpen();
      expect(screen.getByTitle('routes._id')).to.be.visible;

      expect(screen.queryByLabelText(/delete field/i)).not.to.exist;
      expect(screen.getByLabelText('Field name')).to.have.attribute(
        'aria-disabled',
        'true'
      );
      expect(screen.getByLabelText('Datatype')).to.have.attribute(
        'aria-disabled',
        'true'
      );
    });

    it('nested _id field is not treated as readonly', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(
        selectField('flights.routes', ['airline', '_id'])
      );

      await waitForDrawerToOpen();
      expect(screen.getByTitle('routes.airline._id')).to.be.visible;

      expect(screen.queryByLabelText(/delete field/i)).to.exist;
      expect(screen.queryByLabelText(/delete field/i)).to.have.attribute(
        'aria-disabled',
        'false'
      );
      expect(screen.getByLabelText('Field name')).to.have.attribute(
        'aria-disabled',
        'false'
      );
      expect(screen.getByLabelText('Datatype')).to.have.attribute(
        'aria-disabled',
        'false'
      );
    });
  });

  it('should change the content of the drawer when selecting different items', async function () {
    const result = renderDrawer();

    result.plugin.store.dispatch(selectCollection('flights.airlines'));

    await waitForDrawerToOpen();

    expect(screen.getByLabelText('Name')).to.have.value('airlines');

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

  describe('Collection -> Relationships', function () {
    it('should add a relationship starting from a collection', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(selectCollection('flights.countries'));

      await waitForDrawerToOpen();
      expect(screen.getByLabelText('Name')).to.have.value('countries');

      // Click on add relationship button
      userEvent.click(screen.getByRole('button', { name: 'Add Relationship' }));

      // Collection is pre-selected
      expect(screen.getByLabelText('Local collection')).to.be.visible;
      expect(screen.getByLabelText('Local collection')).to.have.value(
        'countries'
      );
    });

    it('should open and edit relationship starting from a collection', async function () {
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

    it('should delete a relationship from a collection', async function () {
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
  });

  describe('Field -> Relationships', function () {
    it('should add a relationship starting from a field', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(selectField('flights.countries', ['name']));

      await waitForDrawerToOpen();
      expect(screen.getByLabelText('Field name')).to.have.value('name');

      // Click on add relationship button
      userEvent.click(screen.getByRole('button', { name: 'Add Relationship' }));

      // Collection and field are pre-selected
      expect(screen.getByLabelText('Local collection')).to.be.visible;
      expect(screen.getByLabelText('Local collection')).to.have.value(
        'countries'
      );
      expect(screen.getByLabelText('Local field')).to.be.visible;
      expect(screen.getByLabelText('Local field')).to.have.value('name');
    });

    it('should open a relationship starting from a field', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(selectField('flights.countries', ['name']));

      await waitFor(() => {
        expect(screen.getByLabelText('Field name')).to.have.value('name');
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
      expect(screen.getByLabelText('Local field')).to.have.value('name');
      expect(screen.getByLabelText('Foreign field')).to.be.visible;
      expect(screen.getByLabelText('Foreign field')).to.have.value('Country');
    });

    it('should delete a relationship from a field', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(selectField('flights.countries', ['name']));

      await waitFor(() => {
        expect(screen.getByLabelText('Field name')).to.have.value('name');
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
        expect(screen.queryByText('airports.Country')).not.to.exist;
      });
    });
  });

  describe('When a collection is selected', function () {
    it('should render and edit a collection in collection context drawer when collection is clicked', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(selectCollection('flights.airlines'));

      await waitForDrawerToOpen();

      expect(screen.getByTitle('airlines')).to.be.visible;

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

    it('should delete a collection', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(selectCollection('flights.countries'));

      await waitForDrawerToOpen();

      expect(screen.getByLabelText('Name')).to.have.value('countries');

      userEvent.click(screen.getByLabelText(/delete collection/i));

      await waitFor(() => {
        expect(screen.queryByText('countries')).not.to.exist;
      });
      expect(screen.queryByLabelText('Name')).to.not.exist;

      const modifiedCollection = selectCurrentModelFromState(
        result.plugin.store.getState()
      ).collections.find((coll) => {
        return coll.ns === 'flights.countries';
      });

      expect(modifiedCollection).to.be.undefined;
    });

    it('should open and edit a collection name', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(selectCollection('flights.countries'));

      await waitForDrawerToOpen();

      expect(screen.getByLabelText('Name')).to.have.value('countries');

      // Update the name.
      updateInputWithBlur('Name', 'pineapple');

      // Check the name in the model.
      const modifiedCollection = selectCurrentModelFromState(
        result.plugin.store.getState()
      ).collections.find((c: DataModelCollection) => {
        return c.ns === 'flights.pineapple';
      });

      expect(modifiedCollection).to.exist;
    });

    it('should handle new collection creation', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(addCollection());

      await waitForDrawerToOpen();

      expect(screen.getByLabelText('Name')).to.have.value('new-collection');

      // The name should be focused
      const nameInput = screen.getByLabelText<HTMLInputElement>('Name');
      const activeElement = document.activeElement;
      expect(activeElement).to.equal(nameInput);

      // Update the name.
      updateInputWithBlur('Name', 'pineapple');

      // Check the name in the model.
      const newCollection = selectCurrentModelFromState(
        result.plugin.store.getState()
      ).collections.find((c: DataModelCollection) => {
        return c.ns === 'flights.pineapple';
      });
      expect(newCollection).to.exist;

      // See the name in the input
      expect(screen.getByText('pineapple')).to.be.visible;
    });

    it('should prevent editing to an empty collection name', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(selectCollection('flights.countries'));

      await waitForDrawerToOpen();

      expect(screen.getByLabelText('Name')).to.have.value('countries');
      expect(screen.getByLabelText('Name')).to.have.attribute(
        'aria-invalid',
        'false'
      );

      updateInputWithBlur('Name', '');

      await waitFor(() => {
        expect(screen.getByLabelText('Name')).to.have.attribute(
          'aria-invalid',
          'true'
        );
      });

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

      await waitForDrawerToOpen();

      expect(screen.getByLabelText('Name')).to.have.value('countries');
      expect(screen.getByLabelText('Name')).to.have.attribute(
        'aria-invalid',
        'false'
      );

      updateInputWithBlur('Name', 'airlines');

      await waitFor(() => {
        expect(screen.getByLabelText('Name')).to.have.attribute(
          'aria-invalid',
          'true'
        );
      });

      const notModifiedCollection = selectCurrentModelFromState(
        result.plugin.store.getState()
      ).collections.find((c: DataModelCollection) => {
        return c.ns === 'flights.countries';
      });

      expect(notModifiedCollection).to.exist;
    });

    it('should handle collection name and notes editing using enter', async function () {
      const result = renderDrawer();
      result.plugin.store.dispatch(addCollection());

      await waitForDrawerToOpen();

      updateInputWithEnter('Name', 'pineapple');

      userEvent.click(screen.getByRole('textbox', { name: 'Notes' }));
      userEvent.type(
        screen.getByRole('textbox', { name: 'Notes' }),
        'Note about the relationship{shift>}{enter}{/shift}next line'
      );

      const collection = selectCurrentModelFromState(
        result.plugin.store.getState()
      ).collections.find((n) => n.ns === 'flights.pineapple');
      expect(collection).to.exist;
      expect(screen.getByRole('textbox', { name: 'Notes' })).to.have.value(
        'Note about the relationship\nnext line'
      );
    });
  });
});
