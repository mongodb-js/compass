import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import IndexHeader from '../index-header';
import styles from './index-header.module.less';

describe('index-header [Component]', function () {
  let component;
  describe('isReadable', function () {
    beforeEach(function () {
      component = mount(
        <IndexHeader
          isWritable
          isReadonly={false}
          indexes={[]}
          sortOrder=""
          sortColumn=""
          sortIndexes={() => {}}
        />
      );
    });
    afterEach(function () {
      component = null;
    });
    it('renders the correct root classname', function () {
      expect(component.find(`.${styles['index-header']}`)).to.be.present();
    });

    it('renders name column header', function () {
      expect(
        component.find('[data-test-id="index-header-name"]')
      ).to.be.present();
    });
    it('renders type column header', function () {
      expect(
        component.find('[data-test-id="index-header-type"]')
      ).to.be.present();
    });
    it('renders size column header', function () {
      expect(
        component.find('[data-test-id="index-header-size"]')
      ).to.be.present();
    });
    it('renders usage column header', function () {
      expect(
        component.find('[data-test-id="index-header-usage"]')
      ).to.be.present();
    });
    it('renders properties column header', function () {
      expect(
        component.find('[data-test-id="index-header-properties"]')
      ).to.be.present();
    });
  });
  describe('isReadonly', function () {
    beforeEach(function () {
      component = mount(
        <IndexHeader
          isWritable
          isReadonly
          indexes={[]}
          sortOrder=""
          sortColumn=""
          sortIndexes={() => {}}
        />
      );
    });
    afterEach(function () {
      component = null;
    });
    it('renders the correct root classname', function () {
      expect(component.find(`.${styles['index-header']}`)).to.be.present();
    });

    it('renders name column header', function () {
      expect(
        component.find('[data-test-id="index-header-name"]')
      ).to.be.present();
    });
    it('renders type column header', function () {
      expect(
        component.find('[data-test-id="index-header-type"]')
      ).to.be.present();
    });
    it('renders size column header', function () {
      expect(
        component.find('[data-test-id="index-header-size"]')
      ).to.be.present();
    });
    it('renders usage column header', function () {
      expect(
        component.find('[data-test-id="index-header-usage"]')
      ).to.be.present();
    });
    it('renders properties column header', function () {
      expect(
        component.find('[data-test-id="index-header-properties"]')
      ).to.be.present();
    });
  });
});
