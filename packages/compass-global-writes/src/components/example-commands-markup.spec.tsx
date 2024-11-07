import React from 'react';
import { renderWithStore } from '../../tests/create-store';
import { expect } from 'chai';
import { screen } from '@mongodb-js/testing-library-compass';
import ExampleCommandsMarkup, {
  type ExampleCommandsMarkupProps,
} from './example-commands-markup';
import { type ShardKey } from '../store/reducer';

describe('ExampleCommandsMarkup', function () {
  const db = 'db1';
  const coll = 'coll1';
  const namespace = `${db}.${coll}`;
  const shardKey: ShardKey = {
    fields: [
      { type: 'RANGE', name: 'location' },
      { type: 'HASHED', name: 'secondary' },
    ],
    isUnique: false,
  };

  function renderWithProps(props?: Partial<ExampleCommandsMarkupProps>) {
    return renderWithStore(
      <ExampleCommandsMarkup
        namespace={namespace}
        shardKey={shardKey}
        {...props}
      />
    );
  }

  it('Contains sample codes', async function () {
    await renderWithProps();

    const findingDocumentsSample = await screen.findByTestId(
      'sample-finding-documents'
    );
    expect(findingDocumentsSample).to.be.visible;
    expect(findingDocumentsSample.textContent).to.contain(
      `use db1db["coll1"].find({"location": "US-NY", "secondary": "<id_value>"})`
    );

    const insertingDocumentsSample = await screen.findByTestId(
      'sample-inserting-documents'
    );
    expect(insertingDocumentsSample).to.be.visible;
    expect(insertingDocumentsSample.textContent).to.contain(
      `use db1db["coll1"].insertOne({"location": "US-NY", "secondary": "<id_value>",...<other fields>})`
    );
  });
});
