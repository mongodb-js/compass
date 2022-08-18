import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import IndexList from '../index-list';
import IndexComponent from '../index-component';

const indexes = [
  {
    name: 'a',
    type: 'regular',
    fields: { serialize: () => {} },
    size: 10,
    relativeSize: 10,
  },
  {
    name: 'b',
    type: 'regular',
    fields: { serialize: () => {} },
    size: 20,
    relativeSize: 20,
  },
];

describe('index-list [Component]', function () {
  const localAppRegistry = new AppRegistry();
  let component;

  describe('render', function () {
    beforeEach(function () {
      component = mount(
        <IndexList
          localAppRegistry={localAppRegistry}
          isWritable
          isReadonly={false}
          toggleIsVisible={() => {}}
          nameChanged={() => {}}
          indexes={indexes}
          openLink={() => {}}
        />
      );
    });
    afterEach(function () {
      component = null;
    });
    it('renders the list', function () {
      expect(component.find(IndexComponent)).to.have.lengthOf(2);
    });
  });
});
