import React from 'react';
import { mount } from 'enzyme';
import { Button } from '@mongodb-js/compass-components';

import CollectionHeaderActions from '../collection-header-actions';
import ViewInformation from '../collection-header-actions/view-information';

describe('CollectionHeaderActions [Component]', () => {
  context('when the collection is not readonly', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollectionHeaderActions
          isReadonly={false}
          namespace="db.coll"
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render view information', () => {
      expect(component.find(ViewInformation)).to.not.be.present();
    });

    it('does not render any buttons', () => {
      expect(component.find(Button)).to.not.be.present();
    });
  });

  context('when the collection is readonly', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollectionHeaderActions
          isReadonly
          namespace="db.coll"
          sourceName="orig.coll"
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the source collection', () => {
      expect(
        component.find(ViewInformation)
      ).to.have.text('view on: orig.coll');
    });

    it('renders view information', () => {
      expect(component.find(ViewInformation)).to.be.present();
    });
  });

  context('when the collection is readonly but not a view', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollectionHeaderActions
          isReadonly
          sourceName={null}
          namespace="db.coll"
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render view information', () => {
      expect(component.find(ViewInformation)).to.not.be.present();
    });
  });

  context('when the collection is a view', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollectionHeaderActions
          isReadonly
          sourceName="db.someSource"
          namespace="db.coll"
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('shows a button to edit the view pipeline', () => {
      expect(component.find(Button).text()).to.include('EDIT VIEW');
    });
  });

  context('when the collection is editing a view', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <CollectionHeaderActions
          editViewName="db.editing"
          sourceName={null}
          namespace="db.coll"
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('shows a button to return to the view', () => {
      expect(component.find(Button).text()).to.include('Return to View');
    });
  });
});
