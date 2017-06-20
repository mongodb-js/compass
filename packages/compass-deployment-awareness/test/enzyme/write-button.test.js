const React = require('react');
const sinon = require('sinon');
const AppRegistry = require('hadron-app-registry');
const chai = require('chai');
const expect = chai.expect;
const { shallow } = require('enzyme');
const chaiEnzyme = require('chai-enzyme');
const WriteButton = require('../../src/components/write-button');
const WriteStateStore = require('../../src/stores/write-state-store');

chai.use(chaiEnzyme());

describe('<WriteButton />', () => {
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
            <WriteButton
              className="testing"
              clickHandler={click}
              text="test button"
              dataTestId="test-id" />
          );
        });

        afterEach(() => {
          WriteStateStore.setState(WriteStateStore.getInitialState());
        });

        it('renders the wrapper', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('tip', '');
        });

        it('renders the data-test-id', () => {
          const button = component.find('.testing');
          expect(button).to.have.data('test-id', 'test-id');
        });

        it('renders the button text', () => {
          const button = component.find('.testing');
          expect(button).to.have.text('test button');
        });

        it('sets the button as enabled', () => {
          const button = component.find('.testing');
          expect(button).to.not.be.disabled();
        });

        context('when clicking on the button', () => {
          beforeEach(() => {
            component.find('.testing').simulate('click');
          });

          it('calls the button click handler', () => {
            expect(spy).to.have.property('callCount', 1);
          });
        });
      });

      context('when the write state is not writable', () => {
        let component;

        beforeEach(() => {
          const click = () => {};
          component = shallow(
            <WriteButton
              className="testing"
              clickHandler={click}
              text="test button"
              dataTestId="test-id" />
          );
        });

        it('sets the button as disabled', () => {
          const button = component.find('.testing');
          expect(button).to.be.disabled();
        });

        it('renders the wrapper data-tip', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('tip', '');
        });

        it('renders the wrapper data-for', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('for', '');
        });
      });
    });

    context('when the button is collection level', () => {
      context('when the collection is readonly', () => {
        let component;
        const store = {
          isReadonly: () => { return true; }
        };

        beforeEach(() => {
          global.hadronApp.appRegistry.registerStore('App.CollectionStore', store);
          WriteStateStore.setState({ isWritable: true });
          const click = () => {};
          component = shallow(
            <WriteButton
              className="testing"
              clickHandler={click}
              isCollectionLevel
              text="test button"
              dataTestId="test-id" />
          );
        });

        it('sets the button as disabled', () => {
          const button = component.find('.testing');
          expect(button).to.be.disabled();
        });

        it('renders the wrapper data-tip', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('tip', '');
        });

        it('renders the wrapper data-for', () => {
          const wrapper = component.find('.tooltip-button-wrapper');
          expect(wrapper).to.have.data('for', '');
        });
      });

      context('when the collection is not readonly', () => {
        let component;
        const store = {
          isReadonly: () => { return false; }
        };

        beforeEach(() => {
          global.hadronApp.appRegistry.registerStore('App.CollectionStore', store);
          WriteStateStore.setState({ isWritable: true });
          const click = () => {};
          component = shallow(
            <WriteButton
              className="testing"
              clickHandler={click}
              isCollectionLevel
              text="test button"
              dataTestId="test-id" />
          );
        });

        it('sets the button as enabled', () => {
          const button = component.find('.testing');
          expect(button).to.not.be.disabled();
        });
      });
    });
  });
});
