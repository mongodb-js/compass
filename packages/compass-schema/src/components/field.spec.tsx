import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import userEvent from '@testing-library/user-event';
import {
  parseSchema,
  type PrimitiveSchemaType,
  type SchemaType,
} from 'mongodb-schema';
import { BSON, Decimal128 } from 'bson';

import configureActions from '../actions';
import Field, { shouldShowUnboundArrayInsight } from './field';

describe('Field', function () {
  let container: HTMLElement;
  let testAppRegistry: AppRegistry;

  beforeEach(function () {
    testAppRegistry = new AppRegistry();
    testAppRegistry.registerStore('Query.Store', {
      getState() {
        return {
          queryBar: {
            fields: {
              filter: {
                value: {},
                string: '',
                valid: true,
              },
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
      const types: PrimitiveSchemaType[] = [
        {
          name: 'Decimal128',
          path: ['testFieldName'],
          probability: 0.7,
          count: 3,
          bsonType: 'Decimal128',
          values: [
            new Decimal128('123'),
            new Decimal128('345'),
            new Decimal128('999'),
          ],
        },
        {
          name: 'String',
          path: ['testFieldName'],
          probability: 0.3,
          count: 3,
          bsonType: 'String',
          values: ['testa', 'testb', 'testc'],
        },
      ];
      render(
        <Field
          enableMaps={false}
          actions={configureActions()}
          localAppRegistry={testAppRegistry}
          name="testFieldName"
          path={['test']}
          types={types}
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
      expect(within(container).getByText('Decimal128')).to.be.visible;
      expect(within(container).queryByText('Int32')).to.not.exist;
    });
  });

  describe('document field with nested fields', function () {
    beforeEach(function () {
      const types: SchemaType[] = [
        {
          name: 'Document',
          path: ['documentField'],
          probability: 0.7,
          count: 1,
          bsonType: 'Document',
          fields: [
            {
              name: 'nestedFieldName',
              path: ['documentField', 'nestedFieldName'],
              probability: 1, // Always exists
              count: 2,
              hasDuplicates: false,
              type: ['String'],
              types: [
                {
                  name: 'String',
                  path: ['documentField', 'nestedFieldName'],
                  probability: 1,
                  count: 2,
                  bsonType: 'String',
                  values: ['test11', 'test22'],
                },
              ],
            },
          ],
        },
        {
          name: 'String',
          path: ['documentField'],
          probability: 0.3,
          count: 1,
          bsonType: 'String',
          values: ['testa'],
        },
      ];
      render(
        <Field
          enableMaps={false}
          actions={configureActions()}
          localAppRegistry={testAppRegistry}
          name="documentField"
          path={['documentField']}
          types={types}
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
    const types: SchemaType[] = [
      {
        name: 'Array',
        path: ['arrayField'],
        probability: 0.7,
        count: 2,
        bsonType: 'Array',
        lengths: [2, 2],
        averageLength: 2,
        totalCount: 4,
        types: [
          {
            name: 'String',
            path: ['arrayField'],
            probability: 0.6,
            count: 2,
            bsonType: 'String',
            values: ['test11', 'test22'],
          },
          {
            name: 'Decimal128',
            path: ['arrayField'],
            probability: 0.4,
            count: 2,
            bsonType: 'Decimal128',
            values: [new Decimal128('555'), new Decimal128('777')],
          },
        ],
      },
      {
        name: 'Date',
        path: ['arrayField'],
        probability: 0.3,
        count: 1,
        bsonType: 'Date',
      },
    ];
    beforeEach(function () {
      render(
        <Field
          enableMaps={false}
          actions={configureActions()}
          localAppRegistry={testAppRegistry}
          name="arrayField"
          path={['arrayField']}
          types={types}
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
      expect(within(container).getByText('Decimal128')).to.be.visible;
      expect(within(container).queryByText('Int32')).to.not.exist;
    });
  });
});

describe('shouldShowUnboundArrayInsight', function () {
  async function getTypesForValue(val: any) {
    return (await parseSchema([{ a: val }])).fields[0].types;
  }

  it('should return true when document matches criteria', async function () {
    const schemas = await Promise.all(
      [{ a: 1 }, new BSON.ObjectId(), 'a'].map((val) => {
        return getTypesForValue([val]);
      })
    );

    for (const schemaType of schemas) {
      expect(shouldShowUnboundArrayInsight(schemaType, 1)).to.eq(true);
    }
  });

  it("should return false when document doesn't match criteria", async function () {
    const tooSmall = await getTypesForValue([1, 2, 3]);
    expect(shouldShowUnboundArrayInsight(tooSmall, 5)).to.eq(false);
    const wrongType = await getTypesForValue([1.2]);
    expect(shouldShowUnboundArrayInsight(wrongType, 1)).to.eq(false);
    const notArray = await getTypesForValue(true);
    expect(shouldShowUnboundArrayInsight(notArray, 1)).to.eq(false);
  });
});
