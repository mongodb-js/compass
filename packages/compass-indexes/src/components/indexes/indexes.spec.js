import React from 'react';
import { mount } from 'enzyme';

import { Indexes } from 'components/indexes';
import styles from './indexes.less';

import CreateIndexButton from 'components/create-index-button';
import { StatusRow } from 'hadron-react-components';
import IndexHeader from 'components/index-header';
import IndexList from 'components/index-list';

/* eslint react/jsx-boolean-value: 0 */
describe('indexes [Component]', () => {
  let component;
  const sortIndexesSpy = sinon.spy();
  const toggleIsVisibleSpy = sinon.spy();
  const resetSpy = sinon.spy();
  const changeNameSpy = sinon.spy();
  const openLinkSpy = sinon.spy();

  context('when the collection is not a readonly view', () => {
    beforeEach(() => {
      component = mount(
        <Indexes
          isWritable={true}
          isReadonly={false}
          isReadonlyView={false}
          description="testing"
          indexes={[]}
          sortColumn="Name and Definition"
          sortOrder="asc"
          sortIndexes={sortIndexesSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          reset={resetSpy}
          changeName={changeNameSpy}
          openLink={openLinkSpy} />
      );
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
    });

    it('does not render a status row', () => {
      expect(component.find(StatusRow)).to.not.be.present();
    });

    it('renders the list and header', () => {
      expect(component.find(IndexHeader)).to.be.present();
      expect(component.find(IndexList)).to.be.present();
    });
  });

  context('when the collection is a readonly view', () => {
    beforeEach(() => {
      component = mount(
        <Indexes
          isWritable={true}
          isReadonly={false}
          isReadonlyView={true}
          description="testing"
          indexes={[]}
          sortColumn="Name and Definition"
          sortOrder="asc"
          sortIndexes={sortIndexesSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          reset={resetSpy}
          changeName={changeNameSpy}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
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
    });

    it('renders a status row', () => {
      expect(component.find(StatusRow)).to.be.present();
      expect(component.find(StatusRow).text()).to.equal(
        'Readonly views may not contain indexes.'
      );
    });

    it('does not render the list or header', () => {
      expect(component.find(IndexHeader)).to.not.be.present();
      expect(component.find(IndexList)).to.not.be.present();
    });
  });

  context('when the distribution is readonly', () => {
    beforeEach(() => {
      component = mount(
        <Indexes
          isWritable={true}
          isReadonly={true}
          isReadonlyView={false}
          description="testing"
          indexes={[]}
          sortColumn="Name and Definition"
          sortOrder="asc"
          sortIndexes={sortIndexesSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          reset={resetSpy}
          changeName={changeNameSpy}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.indexes}`)).to.be.present();
    });

    it('does not render a create-index-button', () => {
      expect(component.find(CreateIndexButton)).to.not.be.present();
    });

    it('does not render the controls container', () => {
      expect(component.find(CreateIndexButton)).to.not.be.present();
    });

    it('does not render a status row', () => {
      expect(component.find(StatusRow)).to.not.be.present();
    });

    it('renders the main column', () => {
      expect(component.find(IndexHeader)).to.be.present();
      expect(component.find(IndexList)).to.be.present();
    });
  });

  context('when there is an error', () => {
    beforeEach(() => {
      component = mount(
        <Indexes
          isWritable={true}
          isReadonly={false}
          isReadonlyView={false}
          description="testing"
          indexes={[]}
          sortColumn="Name and Definition"
          sortOrder="asc"
          error="a test error"
          sortIndexes={sortIndexesSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          reset={resetSpy}
          changeName={changeNameSpy}
          openLink={openLinkSpy} />
      );
    });

    afterEach(() => {
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
