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
        wrapper = mount(<EditableValue element={element} isFocused={false} tz="UTC" version="3.6.0" />);
      });

      it('does not auto focus the input', () => {
        const input = wrapper.instance()._node;
        expect(input).to.not.equal(document.activeElement);
      });
    });

    context('when the value not being editing', () => {
      let wrapper;

      before(() => {
        const parentElement = new Element('parent', {}, false);
        const element = new Element('name', 'test', false, parentElement);
        wrapper = mount(<EditableValue element={element} isFocused={false} tz="UTC" version="3.6.0" />);
      });

      it('has a width equal to the amount of characters + 2.5', () => {
        expect(wrapper.find('textarea').prop('style').width).to.equal('6.5ch');
      });
    });

    context('when the value is a string type and its being editing', () => {
      let wrapper;

      before(() => {
        const parentElement = new Element('parent', {}, false);
        const element = new Element('name', 'test', false, parentElement);
        wrapper = mount(<EditableValue element={element} isFocused={false} tz="UTC" version="3.6.0" />);
        wrapper.setState({ editing: true });
      });

      it('does not an input element', () => {
        expect(wrapper.find('input')).to.not.be.present();
      });

      it('shows a textarea for input', () => {
        expect(wrapper.find('textarea')).to.be.present();
      });

      it('has a minHeight of 17px', () => {
        expect(wrapper.find('textarea').prop('style').minHeight).to.equal('17px');
      });

      it('has a width equal to the amount of characters + 1', () => {
        expect(wrapper.find('textarea').prop('style').width).to.equal('7ch');
      });
    });

    context('when the value is not a string type and its being edited', () => {
      let wrapper;

      before(() => {
        const parentElement = new Element('parent', {}, false);
        const element = new Element('name', 333, false, parentElement);
        wrapper = mount(<EditableValue element={element} isFocused={false} tz="UTC" version="3.6.0" />);
      });

      it('does not show a textarea for input', () => {
        expect(wrapper.find('textarea')).to.not.be.present();
      });

      it('shows an input field for input', () => {
        expect(wrapper.find('input')).to.be.present();
      });
    });

    context('when the value is a multi-line string type and its being editing', () => {
      let wrapper;

      before(() => {
        const parentElement = new Element('parent', {}, false);
        const element = new Element('name', 'test\n\nok', false, parentElement);
        wrapper = mount(<EditableValue element={element} isFocused={false} tz="UTC" version="3.6.0" />);
        wrapper.setState({ editing: true });
      });

      it('has a minHeight of 76px', () => {
        expect(wrapper.find('textarea').prop('style').minHeight).to.equal('77px');
      });

      it('has a width of 100%', () => {
        expect(wrapper.find('textarea').prop('style').width).to.equal('100%');
      });
    });
  });
});
