import React from 'react';
import AppRegistry from 'hadron-app-registry';
import { shallow } from 'enzyme';
import TextWriteButton from './text-write-button';
import WriteStateStore from '../stores/write-state-store';

describe('<TextWriteButton />', () => {
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
          const click = () => { spy(); };
          component = shallow(
            <TextWriteButton
              className="testing"
              clickHandler={click}
              text="test button"
              dataTestId="test-id"
              tooltipId="test-button" />
          );
        });

        afterEach(() => {
          WriteStateStore.setState(WriteStateStore.getInitialState());
        });

        it('renders the wrapper', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.be.present();
        });

        it('renders the data-test-id', () => {
          const button = component.find('.testing');
          expect(button.dive()).to.have.data('test-id', 'test-id');
        });

        it('renders the button text', () => {
          const button = component.find('.testing');
          expect(button.dive()).to.have.text('test button');
        });

        it('sets the button as enabled', () => {
          const button = component.find('.testing');
          expect(button.dive()).to.not.be.disabled();
        });

        it('sets the tooltipId', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('for', 'test-button');
        });

        context('when clicking on the button', () => {
          beforeEach(() => {
            component.find('.testing').dive().simulate('click');
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
          const click = () => {};
          component = shallow(
            <TextWriteButton
              className="testing"
              clickHandler={click}
              text="test button"
              dataTestId="test-id"
              tooltipId="test-button" />
          );
        });

        it('sets the button as disabled', () => {
          const button = component.find('.testing');
          expect(button.dive()).to.be.disabled();
        });

        it('renders the wrapper data-tip', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('tip', 'Topology type not yet discovered.');
        });

        it('renders the wrapper data-for', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('for', 'test-button');
        });
      });
    });
  });
});
