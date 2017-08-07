const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const app = require('hadron-app');
const { mount } = require('enzyme');
const { Element } = require('hadron-document');
const Types = require('../../src/components/types');

chai.use(chaiEnzyme());

describe('<Types />', () => {
  before(() => {
    global.hadronApp = app;
  });

  describe('#render', () => {
    context('when the server supports high precision decimals', () => {
      let wrapper;
      const element = new Element('name', 1, false);

      before(() => {
        global.hadronApp.instance = {
          build: {
            version: '3.4.0'
          }
        };
        wrapper = mount(<Types element={element} />);
      });

      it('renders the wrapper div', () => {
        const component = wrapper.find('.editable-element-types');
        expect(component).to.be.present();
      });

      it('renders the dropdown button with the current type', () => {
        const button = wrapper.find('#types-dropdown');
        expect(button).to.have.text('Int32');
      });

      it('renders the type list', () => {
        const types = wrapper.find('.dropdown-menu li');
        expect(types.children().length).to.equal(19);
      });

      context('when selecting a type', () => {
        context('when the new type requires no special handling', () => {
          before(() => {
            const item = wrapper.find('.editable-element-type-string');
            item.simulate('mousedown');
          });

          it('changes the element current type', () => {
            expect(element.currentType).to.equal('String');
          });

          it('changes the element current value', () => {
            expect(element.currentValue).to.equal('1');
          });
        });

        context('when the new type is an object', () => {
          before(() => {
            const item = wrapper.find('.editable-element-type-object');
            item.simulate('mousedown');
          });

          it('converts the element to an object', () => {
            expect(element.generateObject()).to.deep.equal({});
          });
        });

        context('when the new type is an array', () => {
          before(() => {
            const item = wrapper.find('.editable-element-type-array');
            item.simulate('mousedown');
          });

          it('converts the element to an array', () => {
            expect(element.generateObject()).to.deep.equal(['']);
          });
        });

        context('when the new type is a date', () => {
          before(() => {
            const item = wrapper.find('.editable-element-type-date');
            item.simulate('mousedown');
          });

          it('converts the element to an empty string', () => {
            expect(element.generateObject()).to.deep.equal({});
          });

          it('sets the value as invalid', () => {
            expect(element.isCurrentTypeValid()).to.equal(false);
          });
        });
      });
    });

    context('when the server does not support high precision decimals', () => {
      let wrapper;
      const element = new Element('name', 1, false);

      before(() => {
        global.hadronApp.instance = {
          build: {
            version: '3.0.0'
          }
        };
        wrapper = mount(<Types element={element} />);
      });

      it('renders the type list without decimal 128', () => {
        const types = wrapper.find('.dropdown-menu li');
        expect(types.children().length).to.equal(18);
      });
    });
  });
});
