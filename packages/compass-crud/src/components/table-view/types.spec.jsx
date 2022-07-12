import React from 'react';
import app from 'hadron-app';
import { mount } from 'enzyme';
import { Element } from 'hadron-document';
import { expect } from 'chai';

import Types from './types';

describe('<Types />', function () {
  before(function () {
    global.hadronApp = app;
  });

  describe('#render', function () {
    context('when the server supports high precision decimals', function () {
      let wrapper;
      const element = new Element('name', 1, false);

      before(function () {
        wrapper = mount(<Types element={element} version="3.4.0" />);
      });

      it('renders the wrapper div', function () {
        const component = wrapper.find('.editable-element-types');
        expect(component).to.be.present();
      });

      it('renders the dropdown button with the current type', function () {
        const button = wrapper.find('#types-dropdown');
        expect(button).to.have.text('Int32');
      });

      it('renders the type list', function () {
        const types = wrapper.find('.dropdown-menu li');
        expect(types.children().length).to.equal(19);
      });

      it('sets the dropdown to closed', function () {
        expect(wrapper).to.have.className('closed');
      });

      context('when clicking the button', function () {
        beforeEach(function () {
          const button = wrapper.find('#types-dropdown');
          button.simulate('click');
        });

        afterEach(function () {
          const button = wrapper.find('#types-dropdown');
          button.simulate('click');
        });

        it('sets the dropdown to open', function () {
          expect(wrapper).to.have.className('open');
        });

        context('when clicking the button again', function () {
          beforeEach(function () {
            const button = wrapper.find('#types-dropdown');
            button.simulate('click');
          });

          afterEach(function () {
            const button = wrapper.find('#types-dropdown');
            button.simulate('click');
          });

          it('sets the dropdown to closed', function () {
            expect(wrapper).to.have.className('closed');
          });
        });
      });

      context('when selecting a type', function () {
        context('when the new type requires no special handling', function () {
          before(function () {
            const item = wrapper.find('.editable-element-type-string');
            item.simulate('mousedown');
          });

          it('changes the element current type', function () {
            expect(element.currentType).to.equal('String');
          });

          it('changes the element current value', function () {
            expect(element.currentValue).to.equal('1');
          });
        });

        context('when the new type is an object', function () {
          before(function () {
            const item = wrapper.find('.editable-element-type-object');
            item.simulate('mousedown');
          });

          it('converts the element to an object', function () {
            expect(element.generateObject()).to.deep.equal({});
          });
        });

        context('when the new type is an array', function () {
          before(function () {
            const item = wrapper.find('.editable-element-type-array');
            item.simulate('mousedown');
          });

          it('converts the element to an array', function () {
            expect(element.generateObject()).to.deep.equal(['']);
          });
        });

        context('when the new type is a date', function () {
          before(function () {
            const item = wrapper.find('.editable-element-type-date');
            item.simulate('mousedown');
          });

          it('sets the value as invalid', function () {
            expect(element.isCurrentTypeValid()).to.equal(false);
          });
        });
      });
    });

    context(
      'when the server does not support high precision decimals',
      function () {
        let wrapper;
        const element = new Element('name', 1, false);

        before(function () {
          wrapper = mount(<Types element={element} version="3.0.0" />);
        });

        it('renders the type list without decimal 128', function () {
          const types = wrapper.find('.dropdown-menu li');
          expect(types.children().length).to.equal(18);
        });
      }
    );
  });
});
