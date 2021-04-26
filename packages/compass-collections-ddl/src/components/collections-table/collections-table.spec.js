import React from 'react';
import { mount } from 'enzyme';

import { INITIAL_STATE as COLUMNS } from 'modules/columns';
import CollectionsTable from 'components/collections-table';
import styles from './collections-table.less';

describe('CollectionsTable [Component]', () => {
  let collections;
  let component;
  let openSpy;
  let sortCollectionsSpy;
  let showCollectionSpy;
  let openLinkSpy;
  let remount;

  beforeEach(() => {
    collections = [
      {
        _id: 'data-service.myView',
        readonly: true,
        type: 'view',
        view_on: 'test',
        pipeline: [{$project: {a: 1}}]
      }
    ];

    openSpy = sinon.spy();
    sortCollectionsSpy = sinon.spy();
    showCollectionSpy = sinon.spy();
    openLinkSpy = sinon.spy();
    remount = () => {
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
    };
    remount();
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

  describe('Views', () => {
    it('renders the viewOn', () => {
      expect(component.find(`.${styles['collections-table-view-on']}`)).to.be.present();
    });

    it('does not render the viewOn when not a view', () => {
      for (const coll of collections) {
        coll.view_on = undefined;
      }
      remount();
      expect(component.find(`.${styles['collections-table-view-on']}`)).to.not.be.present();
    });
  });
});
