import { expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';
import OptionWriteSelector from './option-write-selector';

describe('<OptionWriteSelector />', function () {
  describe('#render', function () {
    context('when the button is not at the collection level', function () {
      context('when the write state is writable', function () {
        let component;
        let spy;

        beforeEach(function () {
          spy = sinon.spy();
          const onSelect = function () {
            spy();
          };
          const options = { 'test-key': 'test-val' };
          component = shallow(
            <OptionWriteSelector
              id="test-id"
              label="test-label"
              title="test option selector"
              options={options}
              tooltipId="test-selector"
              bsSize="small"
              onSelect={onSelect}
              isWritable
              instanceDescription="writable"
            />
          );
        });

        it('renders the wrapper', function () {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.be.present();
        });

        it('renders the button label', function () {
          const button = component.find('#test-id');
          expect(button.dive().text()).to.match(/^test-label/);
        });

        it('sets the button as enabled', function () {
          const button = component.find('#test-id');
          expect(button.dive()).to.not.be.disabled();
        });

        it('sets the tooltipId', function () {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('for', 'test-selector');
        });

        context('when clicking on the button', function () {
          beforeEach(function () {
            component.find('#test-id').simulate('select');
          });

          it('calls the button click handler', function () {
            expect(spy).to.have.property('callCount', 1);
          });
        });
      });

      context('when the write state is not writable', function () {
        let component;

        beforeEach(function () {
          const onSelect = function () {};
          const options = { 'test-key': 'test-val' };
          component = shallow(
            <OptionWriteSelector
              id="test-id"
              label="test"
              title="test option selector"
              bsSize="small"
              options={options}
              onSelect={onSelect}
              tooltipId="test-selector"
              isWritable={false}
              instanceDescription="not writable"
            />
          );
        });

        it('sets the button as disabled', function () {
          const el = component.find('#test-id');
          expect(el.prop('disabled')).to.be.equal(true);
        });

        it('renders the wrapper data-tip', function () {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('tip', 'not writable');
        });

        it('renders the wrapper data-for', function () {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('for', 'test-selector');
        });
      });
    });
  });
});
