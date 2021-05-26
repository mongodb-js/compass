import React from 'react';
import AppRegistry from 'hadron-app-registry';
import { shallow } from 'enzyme';
import OptionWriteSelector from './option-write-selector';
import WriteStateStore from '../stores/write-state-store';

describe('<OptionWriteSelector />', () => {
  describe('#render', () => {
    beforeEach(() => {
      global.hadronApp.appRegistry = new AppRegistry();
    });

    context('when the button is not at the collection level', () => {
      context('when the write state is writable', () => {
        let component;
        let spy;

        beforeEach(() => {
          WriteStateStore.setState({ isWritable: true });
          spy = sinon.spy();
          const onSelect = () => { spy(); };
          const options = { 'test-key': 'test-val' };
          component = shallow(
            <OptionWriteSelector
              id="test-id"
              label="test-label"
              title="test option selector"
              options={options}
              tooltipId="test-selector"
              bsSize="small"
              onSelect={onSelect}/>
          );
        });

        afterEach(() => {
          WriteStateStore.setState(WriteStateStore.getInitialState());
        });

        it('renders the wrapper', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.be.present();
        });

        it('renders the button label', () => {
          const button = component.find('#test-id');
          expect(button.dive().text()).to.match(/^test-label/);
        });

        it('sets the button as enabled', () => {
          const button = component.find('#test-id');
          expect(button.dive()).to.not.be.disabled();
        });

        it('sets the tooltipId', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('for', 'test-selector');
        });

        context('when clicking on the button', () => {
          beforeEach(() => {
            component.find('#test-id').simulate('select');
          });

          it('calls the button click handler', () => {
            expect(spy).to.have.property('callCount', 1);
          });
        });
      });

      context('when the write state is not writable', () => {
        let component;

        beforeEach(() => {
          WriteStateStore.setState({ isWritable: false });
          const onSelect = () => {};
          const options = { 'test-key': 'test-val' };
          component = shallow(
            <OptionWriteSelector
              id="test-id"
              label="test"
              title="test option selector"
              bsSize="small"
              options={options}
              onSelect={onSelect}
              tooltipId="test-selector" />
          );
        });

        it('sets the button as disabled', () => {
          const el = component.find('#test-id');
          expect(el.prop('disabled')).to.be.equal(true);
        });

        it('renders the wrapper data-tip', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('tip', 'Topology type not yet discovered.');
        });

        it('renders the wrapper data-for', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('for', 'test-selector');
        });
      });
    });
  });
});
