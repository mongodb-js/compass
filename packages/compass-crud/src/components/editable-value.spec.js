import React from 'react';
import { mount } from 'enzyme';
import app from 'hadron-app';
import { Element } from 'hadron-document';
import EditableValue from 'components/editable-value';

describe('<EditableValue />', () => {
  before(() => {
    global.hadronApp = app;
  });

  after(() => {
    global.hadronApp = undefined;
  });

  describe('#render', () => {
    context('when the value is for an _id field', () => {
      let wrapper;

      before(() => {
        const element = new Element('_id', 1, false);
        wrapper = mount(<EditableValue element={element} isFocused={false} tz="UTC" version="4.0.0" />);
      });

      it('auto focuses the input', () => {
        const input = wrapper.instance()._node;
        expect(input).to.equal(document.activeElement);
      });
    });

    context('when the value corresponds with an editable key', () => {
      let wrapper;

      before(() => {
        const parentElement = new Element('parent', {}, false);
        const element = new Element('name', 'test', false, parentElement);
        wrapper = mount(<EditableValue element={element} isFocused={false} tz="UTC" />);
      });

      it('does not auto focus the input', () => {
        const input = wrapper.instance()._node;
        expect(input).to.not.equal(document.activeElement);
      });
    });
  });
});
