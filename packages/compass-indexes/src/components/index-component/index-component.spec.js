import React from 'react';
import { mount } from 'enzyme';

import IndexComponent from 'components/index-component';
import styles from './index-component.less';

import NameColumn from 'components/name-column';
import TypeColumn from 'components/type-column';
import SizeColumn from 'components/size-column';
import UsageColumn from 'components/usage-column';
import PropertyColumn from 'components/property-column';
import DropColumn from 'components/drop-column';

const index = {
  name: 'a', type: 'regular', fields: {serialize: () => {}},
  size: 10, relativeSize: 10
};

describe('index-component [Component]', () => {
  let component;
  describe('render', () => {
    beforeEach(() => {
      component = mount(<IndexComponent
        isWritable
        isReadonly={false}
        toggleIsVisible={()=>{}}
        changeName={()=>{}}
        openLink={()=>{}}
        index={index}
      />);
    });
    afterEach(() => {
      component = null;
    });
    it('renders the component', () => {
      expect(component.find(`.${styles['index-component']}`)).to.be.present();
    });
    it('renders the type column', () => {
      expect(component.find(TypeColumn)).to.be.present();
    });
    it('renders the size column', () => {
      expect(component.find(SizeColumn)).to.be.present();
    });
    it('renders the usage column', () => {
      expect(component.find(UsageColumn)).to.be.present();
    });
    it('renders the property column', () => {
      expect(component.find(PropertyColumn)).to.be.present();
    });
    it('renders the drop column', () => {
      expect(component.find(DropColumn)).to.be.present();
    });
    it('renders the name column', () => {
      expect(component.find(NameColumn)).to.be.present();
    });
  });
});
