import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import userEvent from '@testing-library/user-event';

import configureActions from '../actions';
import Field from './field';

describe('Field', function () {
  let container: HTMLElement;
  let testAppRegistry: AppRegistry;

  beforeEach(function () {
    testAppRegistry = new AppRegistry();
    testAppRegistry.registerStore('Query.Store', {
      getState() {
        return {
          fields: {
            filter: {
              value: {},
              string: '',
              valid: true,
            },
          },
        };
      },
      subscribe() {
        return () => {};
      },
    } as any);
  });

  describe('basic field name', function () {
    beforeEach(function () {
      render(
        <Field
          enableMaps={false}
          actions={configureActions()}
          localAppRegistry={testAppRegistry}
          name="testFieldName"
          path="test"
          types={[
            {
              name: 'Double',
              path: 'testFieldName',
              probability: 0.7,
              fields: [],
              types: [],
              values: [123, 345, 999],
            },
            {
              name: 'String',
              path: 'testFieldName',
              probability: 0.3,
              fields: [],
              types: [],
              values: ['testa', 'testb', 'testc'],
            },
          ]}
        />
      );
      container = screen.getByTestId('schema-field');
    });

    it('renders the field name', function () {
      const fieldName = within(container).getByText('testFieldName');
      expect(fieldName).to.be.visible;
    });

    it('renders the various field types', function () {
      expect(within(container).getByText('String')).to.be.visible;
      expect(within(container).getByText('Double')).to.be.visible;
      expect(within(container).queryByText('Int32')).to.not.exist;
    });
  });

  describe('document field with nested fields', function () {
    beforeEach(function () {
      render(
        <Field
          enableMaps={false}
          actions={configureActions()}
          localAppRegistry={testAppRegistry}
          name="documentField"
          path="documentField"
          types={[
            {
              name: 'Document',
              path: 'documentField',
              probability: 0.7,
              fields: [
                {
                  name: 'nestedFieldName',
                  path: 'documentField.nestedFieldName',
                  probability: 1, // Always exists
                  fields: [],
                  types: [
                    {
                      name: 'String',
                      path: 'documentField.nestedFieldName',
                      probability: 1,
                      fields: [],
                      types: [],
                      values: ['test11', 'test22'],
                    },
                  ],
                },
              ],
              types: [],
            },
            {
              name: 'String',
              path: 'documentField',
              probability: 0.3,
              fields: [],
              types: [],
            },
          ]}
        />
      );
      container = screen.getByTestId('schema-field');
    });

    it('renders the field name', function () {
      const fieldName = within(container).getByText('documentField');
      expect(fieldName).to.be.visible;
    });

    it('renders the field type', function () {
      expect(within(container).getByText('Document')).to.be.visible;
    });

    it('does not render the nested fields', function () {
      expect(within(container).queryByText('nestedFieldName')).to.not.exist;
    });

    it('renders the nested fields when the field is clicked', function () {
      const fieldNameButton = within(container).getByText('documentField');
      userEvent.click(fieldNameButton, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(within(container).queryByText('nestedFieldName')).to.be.visible;
    });
  });

  describe('array field with various types', function () {
    beforeEach(function () {
      render(
        <Field
          enableMaps={false}
          actions={configureActions()}
          localAppRegistry={testAppRegistry}
          name="arrayField"
          path="test"
          types={[
            {
              name: 'Array',
              path: 'arrayField',
              probability: 0.7,
              lengths: [2, 2],
              average_length: 2,
              total_count: 4,
              types: [
                {
                  name: 'String',
                  path: 'documentField',
                  probability: 0.6,
                  types: [],
                  values: ['test11', 'test22'],
                },
                {
                  name: 'Double',
                  path: 'documentField',
                  probability: 0.4,
                  types: [],
                  values: [555, 777],
                },
              ],
            },
            {
              name: 'Date',
              path: 'arrayField',
              probability: 0.3,
              fields: [],
              types: [],
            },
          ]}
        />
      );
      container = screen.getByTestId('schema-field');
    });

    it('renders the field name', function () {
      expect(within(container).getByText('arrayField')).to.be.visible;
    });

    it('renders the field type', function () {
      expect(within(container).getByText('Array')).to.be.visible;
    });

    it('renders the various types found in the array', function () {
      expect(within(container).getByText('String')).to.be.visible;
      expect(within(container).getByText('Double')).to.be.visible;
      expect(within(container).queryByText('Int32')).to.not.exist;
    });
  });
});
