import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import IndexComponent from '../index-component';
import styles from './index-component.module.less';

import NameColumn from '../name-column';
import TypeColumn from '../type-column';
import SizeColumn from '../size-column';
import UsageColumn from '../usage-column';
import PropertyColumn from '../property-column';
import DropColumn from '../drop-column';

const index = {
  name: 'a', type: 'regular', fields: {serialize: () => {}},
  size: 10, relativeSize: 10
};

describe('index-component [Component]', function() {
  let component;
  describe('render', function() {
    beforeEach(function() {
      component = mount(<IndexComponent
        isWritable
        isReadonly={false}
        toggleIsVisible={()=>{}}
        changeName={()=>{}}
        openLink={()=>{}}
        index={index}
      />);
    });
    afterEach(function() {
      component = null;
    });
    it('renders the component', function() {
      expect(component.find(`.${styles['index-component']}`)).to.be.present();
    });
    it('renders the type column', function() {
      expect(component.find(TypeColumn)).to.be.present();
    });
    it('renders the size column', function() {
      expect(component.find(SizeColumn)).to.be.present();
    });
    it('renders the usage column', function() {
      expect(component.find(UsageColumn)).to.be.present();
    });
    it('renders the property column', function() {
      expect(component.find(PropertyColumn)).to.be.present();
    });
    it('renders the drop column', function() {
      expect(component.find(DropColumn)).to.be.present();
    });
    it('renders the name column', function() {
      expect(component.find(NameColumn)).to.be.present();
    });
  });
});
