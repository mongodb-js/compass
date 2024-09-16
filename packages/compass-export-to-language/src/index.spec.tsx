import React from 'react';
import {
  screen,
  render,
  cleanup,
  within,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import ExportToLanguagePlugin from './';
import { expect } from 'chai';
import { prettify } from '@mongodb-js/compass-editor';

const allTypesStr = `{
  0: true, 1: 1, 2: NumberLong(100), 3: 0.001, 4: 0x1243, 5: 0o123,
  7: "str", 8: RegExp('10'), '8a': /abc/, '8b': RegExp('abc', 'i'),
  9: [1,2], 10: {x: 1}, 11: null, 12: undefined,
  100: Code("1", {x: 1}), '100a': Code("!"), 101: ObjectId(),
  103: DBRef("c", ObjectId()), 104: 1, 105: NumberInt(1), 106: NumberLong(1),
  107: MinKey(), 108: MaxKey(), 110: Timestamp(1, 100),
  111: Symbol('1'), 112: NumberDecimal(1), 200: Date(), '201a': new Date(),
  '201b': ISODate(), '201c': new ISODate()
}`;

const allTypesPrettyStr = prettify(
  allTypesStr,
  'javascript-expression'
).replace(/\n/g, '');

describe('ExportToLanguagePlugin', function () {
  const dataService = {
    getConnectionString() {
      return Object.assign(new URL('mongodb://localhost:27020'), {
        clone() {
          return this;
        },
      });
    },
  };
  const Plugin = ExportToLanguagePlugin.withMockServices({
    dataService: dataService as any,
  });

  describe('on `open-query-export-to-language` event', function () {
    it('should show query export to language modal', function () {
      const { localAppRegistry } = render(
        <Plugin namespace="db.coll"></Plugin>
      );

      localAppRegistry.emit('open-query-export-to-language', {
        filter: allTypesStr,
      });

      expect(screen.getByTestId('export-to-language-input').textContent).to.eq(
        allTypesPrettyStr
      );
    });

    it('should show other query options in the export', function () {
      const { localAppRegistry } = render(
        <Plugin namespace="db.coll"></Plugin>
      );

      localAppRegistry.emit('open-query-export-to-language', {
        filter: '{ foo: {$exists: true } }',
        project: '{ foo: 1 }',
        sort: '{ _id: -1 }',
        limit: '10',
      });

      userEvent.click(
        screen.getByRole('checkbox', { name: 'Include Driver Syntax' }),
        undefined,
        { skipPointerEventsCheck: true }
      );

      const expected = `# Requires the PyMongo package.
# https://api.mongodb.com/python/current

client = MongoClient('mongodb://localhost:27020')
filter={
    'foo': {
        '$exists': True
    }
}
project={
    'foo': 1
}
sort=list({
    '_id': -1
}.items())
limit=10

result = client['db']['coll'].find(
  filter=filter,
  projection=project,
  sort=sort,
  limit=limit
)
`.replace(/\n/g, '');

      expect(screen.getByTestId('export-to-language-output').textContent).to.eq(
        expected
      );
    });
  });

  describe('on `open-aggregation-export-to-language` event', function () {
    it('should show aggregation export to language modal', function () {
      const { localAppRegistry } = render(
        <Plugin namespace="db.coll"></Plugin>
      );

      localAppRegistry.emit('open-aggregation-export-to-language', allTypesStr);

      expect(screen.getByTestId('export-to-language-input').textContent).to.eq(
        allTypesPrettyStr
      );
    });
  });

  describe('on "Copy" button clicked', function () {
    it('should emit telemetry event', async function () {
      const { localAppRegistry, track } = render(
        <Plugin namespace="db.coll"></Plugin>
      );

      localAppRegistry.emit('open-aggregation-export-to-language', '[]');

      track.resetHistory();

      userEvent.click(
        within(screen.getByTestId('export-to-language-output-field')).getByRole(
          'button',
          { name: 'Copy' }
        )
      );
      await waitFor(() => {
        expect(track).to.have.been.calledWith('Aggregation Exported', {
          language: 'python',
          with_import_statements: false,
          with_drivers_syntax: false,
          with_builders: false,
          num_stages: 0,
          connection_id: 'TEST',
        });
      });
    });
  });
});
