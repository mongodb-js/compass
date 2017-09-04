const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { shallow } = require('enzyme');
const Connection = require('../../../lib/models/connection');
const ConnectionCollection = require('../../../lib/models/connection-collection');
const Connect = require('../../../lib/components/connect');

chai.use(chaiEnzyme());

describe('<Connect />', () => {
  describe('#render', () => {
    const connection = new Connection();
    const connections = new ConnectionCollection();

    context('when no error is present', () => {
      context('when the app is not connected', () => {
        const wrapper = shallow(
          <Connect currentConnection={connection} connections={connections} />
        );

        it('renders the container', () => {
          expect(wrapper.find('.connect')).to.be.present();
        });

        it('renders the header', () => {
          expect(wrapper.find('h2')).to.have.text('Connect to Host');
        });

        it('renders the form container', () => {
          expect(wrapper.find('.form-container')).to.be.present();
        });
      });

      context('when the app is connected', () => {
        const wrapper = shallow(
          <Connect currentConnection={connection} connections={connections} isConnected />
        );

        it('renders the success header', () => {
          expect(wrapper.find('.success')).to.have.text('Connected to localhost:27017');
        });
      });
    });

    context('when an error is present', () => {
      const wrapper = shallow(
        <Connect
          currentConnection={connection}
          connections={connections}
          errorMessage="Error message" />
      );

      it('renders the error header', () => {
        expect(wrapper.find('.error')).to.have.text('Error message');
      });
    });
  });
});
