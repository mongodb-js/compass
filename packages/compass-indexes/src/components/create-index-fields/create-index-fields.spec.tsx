import React from 'react';
import { expect } from 'chai';

import { render, screen, cleanup, fireEvent } from '@testing-library/react';

import CreateIndexFields from '../create-index-fields';

const noop = () => {};

describe('CreateIndexFields Component', function () {
  describe('server version 5.0.0', function () {
    afterEach(cleanup);

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
          createNewIndexField={noop}
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
          createNewIndexField={noop}
        />
      );
      const select = screen.getByTestId('leafygreen-ui-select-menubutton');
      fireEvent.click(select);
      const fieldTypes = screen.getByTestId('create-index-fields-type-0');
      expect(fieldTypes).to.not.contain.html('columnstore');
    });
  });

  describe('server version 6.1.0', function () {
    afterEach(cleanup);

    it('shows columnstore indexes as a selectable index type', function () {
      render(
        <CreateIndexFields
          schemaFields={[]}
          fields={[{ name: '', type: '' }]}
          serverVersion="6.1.0"
          isRemovable
          updateFieldName={noop}
          updateFieldType={noop}
          addField={noop}
          removeField={noop}
          createNewIndexField={noop}
        />
      );
      const select = screen.getByTestId('leafygreen-ui-select-menubutton');
      fireEvent.click(select);
      const fieldTypes = screen.getByTestId('create-index-fields-type-0');
      expect(fieldTypes).to.contain.html('columnstore');
    });
  });
});
