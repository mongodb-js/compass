import React from 'react';
import { expect } from 'chai';

import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import { CreateIndexFields } from './create-index-fields';

const noop = () => {};

describe('CreateIndexFields Component', function () {
  afterEach(cleanup);

  describe('server version 5.0.0', function () {
    it('renders create index fields component', function () {
      render(
        <CreateIndexFields
          schemaFields={[]}
          fields={[{ name: '', type: '' }]}
          serverVersion="5.0.0"
          isRemovable
          updateFieldName={noop}
          updateFieldType={noop}
          addField={noop}
          removeField={noop}
        />
      );
      const fieldsComponent = screen.getByTestId('create-index-fields-line-0');
      expect(fieldsComponent).to.exist;
    });

    it('does not have columnstore indexes as a selectable index type', function () {
      render(
        <CreateIndexFields
          schemaFields={[]}
          fields={[{ name: '', type: '' }]}
          serverVersion="5.0.0"
          isRemovable
          updateFieldName={noop}
          updateFieldType={noop}
          addField={noop}
          removeField={noop}
        />
      );
      const select = screen.getByTestId('leafygreen-ui-select-menubutton');
      fireEvent.click(select);
      expect(screen.queryByText('columnstore')).to.not.exist;
    });

    it('does not render a minus button for a single field', function () {
      render(
        <CreateIndexFields
          schemaFields={[]}
          fields={[{ name: '', type: '' }]}
          serverVersion="5.0.0"
          isRemovable
          updateFieldName={noop}
          updateFieldType={noop}
          addField={noop}
          removeField={noop}
        />
      );
      const minusButton = screen.queryByTestId('remove-index-field-button');
      expect(minusButton).to.not.exist;
    });

    it('renders a minus button for more than one field', function () {
      render(
        <CreateIndexFields
          schemaFields={[]}
          fields={[
            { name: 'name1', type: '1 (asc)' },
            { name: 'name2', type: '1 (asc)' },
          ]}
          serverVersion="5.0.0"
          isRemovable
          updateFieldName={noop}
          updateFieldType={noop}
          addField={noop}
          removeField={noop}
        />
      );
      const minusButton = screen.getAllByTestId('remove-index-field-button');
      expect(minusButton.length).to.be.equal(2);
    });

    it('renders a plus button for a single field', function () {
      render(
        <CreateIndexFields
          schemaFields={[]}
          fields={[{ name: '', type: '' }]}
          serverVersion="5.0.0"
          isRemovable
          updateFieldName={noop}
          updateFieldType={noop}
          addField={noop}
          removeField={noop}
        />
      );
      const minusButton = screen.getAllByTestId('add-index-field-button');
      expect(minusButton.length).to.be.equal(1);
    });

    it('renders a plus button for more than one field', function () {
      render(
        <CreateIndexFields
          schemaFields={[]}
          fields={[
            { name: 'name1', type: '1 (asc)' },
            { name: 'name2', type: '1 (asc)' },
          ]}
          serverVersion="5.0.0"
          isRemovable
          updateFieldName={noop}
          updateFieldType={noop}
          addField={noop}
          removeField={noop}
        />
      );
      const minusButton = screen.getAllByTestId('add-index-field-button');
      expect(minusButton.length).to.be.equal(2);
    });
  });

  describe('server version 20.0.0', function () {
    it('shows columnstore indexes as a selectable index type', function () {
      render(
        <CreateIndexFields
          schemaFields={[]}
          fields={[{ name: '', type: '' }]}
          serverVersion="20.0.0"
          isRemovable
          updateFieldName={noop}
          updateFieldType={noop}
          addField={noop}
          removeField={noop}
        />
      );
      const select = screen.getByTestId('leafygreen-ui-select-menubutton');
      fireEvent.click(select);
      expect(screen.getByText('columnstore')).to.be.visible;
    });
  });
});
