import React from 'react';
import AppRegistry from 'hadron-app-registry';
import { shallow } from 'enzyme';
import TextReadButton from './text-read-button';
import ReadStateStore from '../stores/read-state-store';

describe('<TextReadButton />', () => {
  describe('#render', () => {
    beforeEach(() => {
      global.hadronApp.appRegistry = new AppRegistry();
    });

    context('when the read state is readable', () => {
      let component;
      let spy;
      let style;

      beforeEach(() => {
        ReadStateStore.setState({ isReadable: true });
        spy = sinon.spy();
        style = { color: 'green' };
        const click = () => { spy(); };
        component = shallow(
          <TextReadButton
            id="test-id"
            style={style}
            className="testing"
            clickHandler={click}
            text="test button"
            dataTestId="test-id"
            tooltipId="test-button" />
        );
      });

      afterEach(() => {
        ReadStateStore.setState(ReadStateStore.getInitialState());
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

      it('sets the style', () => {
        const button = component.find('.testing');
        expect(button).to.have.prop('style', style);
      });

      it('sets the id', () => {
        const button = component.find('.testing');
        expect(button).to.have.prop('id', 'test-id');
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

    context('when the read state is not readable', () => {
      let component;
      let spy;

      beforeEach(() => {
        ReadStateStore.setState({ isReadable: false });
        spy = sinon.spy();
        const click = () => { spy(); };
        component = shallow(
          <TextReadButton
            className="testing"
            clickHandler={click}
            text="test button"
            tooltipId="test-button" />
        );
      });

      afterEach(() => {
        ReadStateStore.setState(ReadStateStore.getInitialState());
      });

      it('sets the button as disabled', () => {
        const button = component.find('.testing');
        expect(button.dive()).to.be.disabled();
      });

      it('sets the tooltipId', () => {
        const wrapper = component.find('.tooltip-button-wrapper');
        expect(wrapper).to.have.data('for', 'test-button');
      });

      it('sets the tooltip text', () => {
        const wrapper = component.find('.tooltip-button-wrapper');
        expect(wrapper).to.have.data('tip', 'Topology type not yet discovered.');
      });
    });

    context('when additional disabled options are passed', () => {
      context('when disabled is true', () => {
        let component;
        let spy;

        beforeEach(() => {
          ReadStateStore.setState({ isReadable: true });
          spy = sinon.spy();
          const click = () => { spy(); };
          component = shallow(
            <TextReadButton
              className="testing"
              clickHandler={click}
              text="test button"
              disabled
              tooltipId="test-button" />
          );
        });

        afterEach(() => {
          ReadStateStore.setState(ReadStateStore.getInitialState());
        });

        it('sets the button as disabled', () => {
          const button = component.find('.testing');
          expect(button.dive()).to.be.disabled();
        });
      });

      context('when disabled is false', () => {
        let component;
        let spy;

        beforeEach(() => {
          ReadStateStore.setState({ isReadable: true });
          spy = sinon.spy();
          const click = () => { spy(); };
          component = shallow(
            <TextReadButton
              className="testing"
              clickHandler={click}
              text="test button"
              tooltipId="test-button" />
          );
        });

        afterEach(() => {
          ReadStateStore.setState(ReadStateStore.getInitialState());
        });

        it('sets the button as enabled', () => {
          const button = component.find('.testing');
          expect(button.dive()).to.not.be.disabled();
        });
      });
    });
  });
});
