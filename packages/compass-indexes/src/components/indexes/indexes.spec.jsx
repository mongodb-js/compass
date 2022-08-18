import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';
import { ErrorSummary, WarningSummary } from '@mongodb-js/compass-components';

import styles from './indexes.module.less';
import { Indexes } from '../indexes';
import IndexHeader from '../index-header';
import IndexList from '../index-list';

describe('indexes [Component]', function () {
  const localAppRegistry = new AppRegistry();
  let component;
  const sortIndexesSpy = sinon.spy();
  const toggleIsVisibleSpy = sinon.spy();
  const resetSpy = sinon.spy();
  const nameChangedSpy = sinon.spy();
  const openLinkSpy = sinon.spy();

  before(function () {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = localAppRegistry;
  });

  context('when the collection is not a readonly view', function () {
    beforeEach(function () {
      component = mount(
        <Indexes
          localAppRegistry={localAppRegistry}
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
          nameChanged={nameChangedSpy}
          openLink={openLinkSpy}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the correct root classname', function () {
      expect(component.find(`.${styles.indexes}`)).to.be.present();
    });

    it('renders a create-index-button', function () {
      expect(
        component
          .find('button')
          .findWhere((node) => node.text() === 'Create Index')
      ).to.be.present();
    });

    it('does not render errors or warnings', function () {
      expect(component.find(ErrorSummary)).to.not.be.present();
      expect(component.find(WarningSummary)).to.not.be.present();
    });

    it('renders the list and header', function () {
      expect(component.find(IndexHeader)).to.be.present();
      expect(component.find(IndexList)).to.be.present();
    });
  });

  context('when the collection is a readonly view', function () {
    beforeEach(function () {
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
          nameChanged={nameChangedSpy}
          openLink={openLinkSpy}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('does not render the correct root classname', function () {
      expect(component.find(`.${styles.indexes}`)).to.not.be.present();
    });

    it('does not render a create-index-button', function () {
      expect(
        component
          .find('button')
          .findWhere((node) => node.text() === 'Create Index')
      ).to.not.be.present();
    });

    it('renders a warning summary', function () {
      expect(component.find(WarningSummary)).to.be.present();
      expect(component.find(WarningSummary).text()).to.equal(
        'Readonly views may not contain indexes.'
      );
    });

    it('does not render the list or header', function () {
      expect(component.find(IndexHeader)).to.not.be.present();
      expect(component.find(IndexList)).to.not.be.present();
    });
  });

  context('when the distribution is readonly', function () {
    beforeEach(function () {
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
          nameChanged={nameChangedSpy}
          openLink={openLinkSpy}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the correct root classname', function () {
      expect(component.find(`.${styles.indexes}`)).to.be.present();
    });

    it('does not render a create-index-button', function () {
      expect(
        component
          .find('button')
          .findWhere((node) => node.text() === 'Create Index')
      ).to.not.be.present();
    });

    it('does not render errors or warnings', function () {
      expect(component.find(ErrorSummary)).to.not.be.present();
      expect(component.find(WarningSummary)).to.not.be.present();
    });

    it('renders the main column', function () {
      expect(component.find(IndexHeader)).to.be.present();
      expect(component.find(IndexList)).to.be.present();
    });
  });

  context('when there is an error', function () {
    beforeEach(function () {
      component = mount(
        <Indexes
          isWritable={true}
          isReadonly={false}
          isReadonlyView={false}
          description="testing"
          indexes={[]}
          sortColumn="Name and Definition"
          sortOrder="asc"
          errorMessage="a test error"
          sortIndexes={sortIndexesSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          reset={resetSpy}
          nameChanged={nameChangedSpy}
          openLink={openLinkSpy}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders an error summary', function () {
      expect(component.find(ErrorSummary)).to.be.present();
      expect(component.find(ErrorSummary).text()).to.equal('a test error');
    });
  });
});
