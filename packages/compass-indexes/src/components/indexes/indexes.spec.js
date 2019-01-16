import React from 'react';
import { mount } from 'enzyme';

import Indexes from 'components/indexes';
import store from 'stores';
import styles from './indexes.less';

import CreateIndexButton from 'components/create-index-button';
import DropIndexModal from 'components/drop-index-modal';
import { StatusRow } from 'hadron-react-components';
import IndexHeader from 'components/index-header';
import IndexList from 'components/index-list';

import { readStateChanged } from 'modules/is-readonly';
import { handleError } from 'modules/error';
import { reset } from 'modules/reset';

describe('indexes [Component]', () => {
  let component;

  describe('not readonly', () => {
    beforeEach(() => {
      component = mount(<Indexes store={store} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.indexes}`)).to.be.present();
    });

    it('renders a create-index-button', () => {
      expect(component.find(CreateIndexButton)).to.be.present();
    });

    it('renders the controls container', () => {
      expect(component.find(CreateIndexButton)).to.be.present();
      expect(component.find(DropIndexModal)).to.be.present();
    });

    it('does not render a status row', () => {
      expect(component.find(StatusRow)).to.not.be.present();
    });

    it('renders the main column', () => {
      expect(component.find(IndexHeader)).to.be.present();
      expect(component.find(IndexList)).to.be.present();
    });
  });

  describe('readonly', () => {
    beforeEach(() => {
      store.dispatch(readStateChanged(true));
      component = mount(<Indexes store={store} />);
    });

    afterEach(() => {
      store.dispatch(reset());
      component = null;
    });

    it('does not render the correct root classname', () => {
      expect(component.find(`.${styles.indexes}`)).to.not.be.present();
    });

    it('does not render a create-index-button', () => {
      expect(component.find(CreateIndexButton)).to.not.be.present();
    });

    it('does not render the controls container', () => {
      expect(component.find(CreateIndexButton)).to.not.be.present();
      expect(component.find(DropIndexModal)).to.be.present();
    });

    it('renders a status row', () => {
      expect(component.find(StatusRow)).to.be.present();
      expect(component.find(StatusRow).text()).to.equal(
        'Readonly views may not contain indexes.'
      );
    });

    it('renders the main column', () => {
      expect(component.find(IndexHeader)).to.not.be.present();
      expect(component.find(IndexList)).to.not.be.present();
    });
  });

  describe('error', () => {
    beforeEach(() => {
      store.dispatch(handleError('a test error'));
      component = mount(<Indexes store={store}/>);
    });

    afterEach(() => {
      store.dispatch(reset());
      component = null;
    });

    it('renders a status row', () => {
      expect(component.find(StatusRow)).to.be.present();
      expect(component.find(StatusRow).text()).to.equal(
        'a test error'
      );
    });
  });
});
