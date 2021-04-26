import React from 'react';
import { mount } from 'enzyme';

import IndexHeader from 'components/index-header';
import styles from './index-header.less';

describe('index-header [Component]', () => {
  let component;
  describe('isReadable', () => {
    beforeEach(() => {
      component = mount(<IndexHeader
        isWritable
        isReadonly={false}
        indexes={[]}
        sortOrder=""
        sortColumn=""
        sortIndexes={()=>{}}
      />);
    });
    afterEach(() => {
      component = null;
    });
    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['index-header']}`)).to.be.present();
    });

    it('renders name column header', () => {
      expect(component.find('[data-test-id="index-header-name"]')).to.be.present();
    });
    it('renders type column header', () => {
      expect(component.find('[data-test-id="index-header-type"]')).to.be.present();
    });
    it('renders size column header', () => {
      expect(component.find('[data-test-id="index-header-size"]')).to.be.present();
    });
    it('renders usage column header', () => {
      expect(component.find('[data-test-id="index-header-usage"]')).to.be.present();
    });
    it('renders properties column header', () => {
      expect(component.find('[data-test-id="index-header-properties"]')).to.be.present();
    });
    it('renders drop column header', () => {
      expect(component.find('[data-test-id="index-header-drop"]')).to.be.present();
    });
  });
  describe('isReadonly', () => {
    beforeEach(() => {
      component = mount(<IndexHeader
        isWritable
        isReadonly
        indexes={[]}
        sortOrder=""
        sortColumn=""
        sortIndexes={()=>{}}
      />);
    });
    afterEach(() => {
      component = null;
    });
    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['index-header']}`)).to.be.present();
    });

    it('renders name column header', () => {
      expect(component.find('[data-test-id="index-header-name"]')).to.be.present();
    });
    it('renders type column header', () => {
      expect(component.find('[data-test-id="index-header-type"]')).to.be.present();
    });
    it('renders size column header', () => {
      expect(component.find('[data-test-id="index-header-size"]')).to.be.present();
    });
    it('renders usage column header', () => {
      expect(component.find('[data-test-id="index-header-usage"]')).to.be.present();
    });
    it('renders properties column header', () => {
      expect(component.find('[data-test-id="index-header-properties"]')).to.be.present();
    });
    it('renders drop column header', () => {
      expect(component.find('[data-test-id="index-header-drop"]')).to.not.be.present();
    });
  });
});
