import React from 'react';
import { mount } from 'enzyme';

import { INITIAL_STATE as COLUMNS } from 'modules/columns';
import CollectionsTable from 'components/collections-table';

describe('CollectionsTable [Component]', () => {
  const collections = [];
  let component;
  let openSpy;
  let sortCollectionsSpy;
  let showCollectionSpy;
  let openLinkSpy;

  beforeEach(() => {
    openSpy = sinon.spy();
    sortCollectionsSpy = sinon.spy();
    showCollectionSpy = sinon.spy();
    openLinkSpy = sinon.spy();
    component = mount(
      <CollectionsTable
        columns={COLUMNS}
        collections={collections}
        isWritable
        isReadonly={false}
        sortOrder="asc"
        sortColumn="Collection Name"
        databaseName="testing"
        open={openSpy}
        sortCollections={sortCollectionsSpy}
        showCollection={showCollectionSpy}
        openLink={openLinkSpy} />
    );
  });

  afterEach(() => {
    component = null;
    openSpy = null;
    sortCollectionsSpy = null;
    showCollectionSpy = null;
    openLinkSpy = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find('.column-container')).to.be.present();
  });

  it('renders the correct wrapper classname', () => {
    expect(component.find('.main')).to.be.present();
  });
});
