import React from 'react';
import { mount } from 'enzyme';

import IndexList from 'components/index-list';
import IndexComponent from 'components/index-component';

const indexes = [
  {
    name: 'a', type: 'regular', fields: {serialize: () => {}},
    size: 10, relativeSize: 10
  },
  {
    name: 'b', type: 'regular', fields: {serialize: () => {}},
    size: 20, relativeSize: 20
  }
];

describe('index-list [Component]', () => {
  let component;
  describe('render', () => {
    beforeEach(() => {
      component = mount(<IndexList
        isWritable
        isReadonly={false}
        toggleIsVisible={()=>{}}
        changeName={()=>{}}
        indexes={indexes}
        openLink={()=>{}}
      />);
    });
    afterEach(() => {
      component = null;
    });
    it('renders the list', () => {
      expect(component.find(IndexComponent)).to.have.lengthOf(2);
    });
  });
});
