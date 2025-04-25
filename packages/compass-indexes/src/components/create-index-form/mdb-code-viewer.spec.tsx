import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import MDBCodeViewer from './mdb-code-viewer';
import { expect } from 'chai';

describe('MDBCodeViewer', () => {
  const dbName = 'testDB';
  const defaultCollectionName = 'testCollection';
  const defaultIndexNameTypeMap = {
    field1: '1 (asc)',
    field2: '-1 (desc)',
    field3: '2dsphere',
    field4: 'text',
  };

  const renderComponent = ({
    collectionName = defaultCollectionName,
    indexNameTypeMap = defaultIndexNameTypeMap,
  }: {
    collectionName?: string;
    indexNameTypeMap?: { [key: string]: string };
  }) => {
    render(
      <MDBCodeViewer
        dbName={dbName}
        collectionName={collectionName}
        indexNameTypeMap={indexNameTypeMap}
      />
    );
  };

  it('shows the db name, collection name, and field names, and field types', () => {
    renderComponent({});
    const codeElement = screen.getByTestId('mdb-code-viewer');
    expect(codeElement).to.have.text(
      'db.getSiblingDB("testDB").getCollection("testCollection").createIndex({  "field1": 1,  "field2": -1,  "field3": "2dsphere",  "field4": "text"});'
    );
  });

  it('shows the escaped version of collection name and field name when there are quotes', () => {
    renderComponent({
      collectionName: 'collection"With"quotes',
      indexNameTypeMap: { 'field"With"quotes': '1' },
    });
    const codeElement = screen.getByTestId('mdb-code-viewer');
    expect(codeElement).to.have.text(
      'db.getSiblingDB("testDB").getCollection("collection\\"With\\"quotes").createIndex({  "field\\"With\\"quotes": 1});'
    );
  });

  it('renders the link to the MongoDB documentation', () => {
    renderComponent({});
    const linkElement = screen.getByText('here');
    expect(linkElement).to.be.visible;
  });
});
