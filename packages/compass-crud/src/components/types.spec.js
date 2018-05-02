import React from 'react';
import app from 'hadron-app';
import { mount } from 'enzyme';
import { Element } from 'hadron-document';
import Types from 'components/types';

describe('<Types />', () => {
  before(() => {
    global.hadronApp = app;
  });

  describe('#render', () => {
    context('when the server supports high precision decimals', () => {
      let wrapper;
      const element = new Element('name', 1, false);

      before(() => {
        wrapper = mount(<Types element={element} version="3.4.0" />);
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

      it('sets the dropdown to closed', () => {
        expect(wrapper).to.have.className('closed');
      });

      context('when clicking the button', () => {
        beforeEach(() => {
          const button = wrapper.find('#types-dropdown');
          button.simulate('click');
        });

        afterEach(() => {
          const button = wrapper.find('#types-dropdown');
          button.simulate('click');
        });

        it('sets the dropdown to open', () => {
          expect(wrapper).to.have.className('open');
        });

        context('when clicking the button again', () => {
          beforeEach(() => {
            const button = wrapper.find('#types-dropdown');
            button.simulate('click');
          });

          afterEach(() => {
            const button = wrapper.find('#types-dropdown');
            button.simulate('click');
          });

          it('sets the dropdown to closed', () => {
            expect(wrapper).to.have.className('closed');
          });
        });
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
        wrapper = mount(<Types element={element} version="3.0.0" />);
      });

      it('renders the type list without decimal 128', () => {
        const types = wrapper.find('.dropdown-menu li');
        expect(types.children().length).to.equal(18);
      });
    });
  });
});
