import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import { Indexes } from '../indexes';
import styles from './indexes.module.less';

import CreateIndexButton from '../create-index-button';
import { StatusRow } from 'hadron-react-components';
import IndexHeader from '../index-header';
import IndexList from '../index-list';

/* eslint react/jsx-boolean-value: 0 */
describe('indexes [Component]', function() {
  let component;
  const sortIndexesSpy = sinon.spy();
  const toggleIsVisibleSpy = sinon.spy();
  const resetSpy = sinon.spy();
  const changeNameSpy = sinon.spy();
  const openLinkSpy = sinon.spy();

  context('when the collection is not a readonly view', function() {
    beforeEach(function() {
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

    afterEach(function() {
      component = null;
    });

    it('renders the correct root classname', function() {
      expect(component.find(`.${styles.indexes}`)).to.be.present();
    });

    it('renders a create-index-button', function() {
      expect(component.find(CreateIndexButton)).to.be.present();
    });

    it('renders the controls container', function() {
      expect(component.find(CreateIndexButton)).to.be.present();
    });

    it('does not render a status row', function() {
      expect(component.find(StatusRow)).to.not.be.present();
    });

    it('renders the list and header', function() {
      expect(component.find(IndexHeader)).to.be.present();
      expect(component.find(IndexList)).to.be.present();
    });
  });

  context('when the collection is a readonly view', function() {
    beforeEach(function() {
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

    afterEach(function() {
      component = null;
    });

    it('does not render the correct root classname', function() {
      expect(component.find(`.${styles.indexes}`)).to.not.be.present();
    });

    it('does not render a create-index-button', function() {
      expect(component.find(CreateIndexButton)).to.not.be.present();
    });

    it('does not render the controls container', function() {
      expect(component.find(CreateIndexButton)).to.not.be.present();
    });

    it('renders a status row', function() {
      expect(component.find(StatusRow)).to.be.present();
      expect(component.find(StatusRow).text()).to.equal(
        'Readonly views may not contain indexes.'
      );
    });

    it('does not render the list or header', function() {
      expect(component.find(IndexHeader)).to.not.be.present();
      expect(component.find(IndexList)).to.not.be.present();
    });
  });

  context('when the distribution is readonly', function() {
    beforeEach(function() {
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

    afterEach(function() {
      component = null;
    });

    it('renders the correct root classname', function() {
      expect(component.find(`.${styles.indexes}`)).to.be.present();
    });

    it('does not render a create-index-button', function() {
      expect(component.find(CreateIndexButton)).to.not.be.present();
    });

    it('does not render the controls container', function() {
      expect(component.find(CreateIndexButton)).to.not.be.present();
    });

    it('does not render a status row', function() {
      expect(component.find(StatusRow)).to.not.be.present();
    });

    it('renders the main column', function() {
      expect(component.find(IndexHeader)).to.be.present();
      expect(component.find(IndexList)).to.be.present();
    });
  });

  context('when there is an error', function() {
    beforeEach(function() {
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

    afterEach(function() {
      component = null;
    });

    it('renders a status row', function() {
      expect(component.find(StatusRow)).to.be.present();
      expect(component.find(StatusRow).text()).to.equal(
        'a test error'
      );
    });
  });
});
