import React from 'react';
import { mount } from 'enzyme';

import { INITIAL_STATE as COLUMNS } from 'modules/columns';
import CollectionsTable from 'components/collections-table';

describe('CollectionsTable [Component]', () => {
  const collections = [];
  let component;
  let resetSpy;
  let sortCollectionsSpy;
  let showCollectionSpy;
  let toggleIsVisibleSpy;
  let changeCollectionNameSpy;
  let openLinkSpy;

  beforeEach(() => {
    resetSpy = sinon.spy();
    sortCollectionsSpy = sinon.spy();
    showCollectionSpy = sinon.spy();
    toggleIsVisibleSpy = sinon.spy();
    changeCollectionNameSpy = sinon.spy();
    openLinkSpy = sinon.spy();
    component = mount(
      <CollectionsTable
        columns={COLUMNS}
        collections={collections}
        isWritable
        isReadonly={false}
        sortOrder="asc"
        sortColumn="Collection Name"
        reset={resetSpy}
        sortCollections={sortCollectionsSpy}
        showCollection={showCollectionSpy}
        changeCollectionName={changeCollectionNameSpy}
        openLink={openLinkSpy}
        toggleIsVisible={toggleIsVisibleSpy} />
    );
  });

  afterEach(() => {
    component = null;
    resetSpy = null;
    sortCollectionsSpy = null;
    showCollectionSpy = null;
    toggleIsVisibleSpy = null;
    changeCollectionNameSpy = null;
    openLinkSpy = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find('.column-container')).to.be.present();
  });

  it('renders the correct wrapper classname', () => {
    expect(component.find('.main')).to.be.present();
  });
});
