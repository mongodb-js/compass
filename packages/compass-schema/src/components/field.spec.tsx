import type { ComponentProps } from 'react';
import React from 'react';
import {
  render,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import {
  parseSchema,
  type PrimitiveSchemaType,
  type SchemaType,
} from 'mongodb-schema';
import { BSON, Decimal128 } from 'bson';
import { configureActions } from '../actions';
import Field, { shouldShowUnboundArrayInsight } from './field';
import QueryBarPlugin from '@mongodb-js/compass-query-bar';
import {
  compassFavoriteQueryStorageAccess,
  compassRecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage';

const MockQueryBarPlugin = QueryBarPlugin.withMockServices({
  dataService: {
    sample() {
      return Promise.resolve([]);
    },
    getConnectionString() {
      return { hosts: [] } as any;
    },
  },
  instance: { on() {}, removeListener() {} } as any,
  favoriteQueryStorageAccess: compassFavoriteQueryStorageAccess,
  recentQueryStorageAccess: compassRecentQueryStorageAccess,
  atlasAiService: {} as any,
});

function renderField(
  props: Partial<ComponentProps<typeof Field>>,
  queryBarProps: Partial<ComponentProps<typeof QueryBarPlugin>> = {}
) {
  return render(
    <MockQueryBarPlugin {...(queryBarProps as any)}>
      <Field
        enableMaps={false}
        actions={configureActions()}
        name="testFieldName"
        path={['test']}
        {...props}
        types={props.types ?? []}
      />
    </MockQueryBarPlugin>
  );
}

describe('Field', function () {
  let container: HTMLElement;

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
      renderField({ types, name: 'testFieldName', path: ['test'] });
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
      renderField({ types, name: 'documentField', path: ['documentField'] });
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
      renderField({ types, name: 'arrayField', path: ['arrayField'] });
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
