import React from 'react';
import { mount } from 'enzyme';
import app from 'hadron-app';
import { Element } from 'hadron-document';
import EditableValue, { boundTextAreaLength } from './editable-value';

describe('<EditableValue />', () => {
  before(() => {
    global.hadronApp = app;
  });

  after(() => {
    global.hadronApp = undefined;
  });

  describe('#boundTextAreaLength', () => {
    context('when the length is < 5 characters', () => {
      it('is bound to 5', () => {
        expect(boundTextAreaLength(1)).to.equal(5);
      });
    });

    context('when the length is within the bounds', () => {
      it('returns the length value +2', () => {
        expect(boundTextAreaLength(25)).to.equal(27);
      });
    });

    context('when the length is > 100 characters', () => {
      it('binds it to 100 characters', () => {
        expect(boundTextAreaLength(150)).to.equal(100);
      });
    });
  });

  describe('#render', () => {
    context('when the value is for an _id field', () => {
      let wrapper;

      before(() => {
        const element = new Element('_id', 1, false);
        wrapper = mount(
          <EditableValue
            element={element}
            isFocused={false}
            tz="UTC"
            version="4.0.0"
          />,
          { attachTo: document.body }
        );
      });

      after(() => {
        if (wrapper && wrapper.unmount) {
          wrapper.unmount();
        }
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

    context('when the value is a string type and it\'s being editing', () => {
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

    context('when the value is a string type with a long length and it\'s being editing', () => {
      let wrapper;

      before(() => {
        const parentElement = new Element('parent', {}, false);
        const longStringValue = 'longStringField longStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringFieldlongStringField longStringField     longStringField pineapples longStringField';
        const element = new Element('name', longStringValue, false, parentElement);
        wrapper = mount(<EditableValue element={element} isFocused={false} tz="UTC" version="3.6.0" />);
        wrapper.setState({ editing: true });
      });

      it('has a minHeight of 28px', () => {
        expect(wrapper.find('textarea').prop('style').minHeight).to.equal('28px');
      });

      it('has a max width equal to 100 (although there are more characters)', () => {
        expect(wrapper.find('textarea').prop('style').width).to.equal('100ch');
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
