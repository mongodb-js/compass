const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const SRVInput = require('../../lib/components/form/srv-input');

chai.use(chaiEnzyme());

describe('<SRVInput />', () => {
  describe('#render', () => {
    context('when the connection is not an srv record', () => {
      const connection = {};
      const component = mount(<SRVInput currentConnection={connection} />);

      it('renders the wrapper div', () => {
        expect(component.find('.form-item')).to.be.present();
      });

      it('renders the label', () => {
        expect(component.find('.form-item-label')).to.have.text('SRV Record');
      });

      it('renders the switch', () => {
        expect(component.find('.form-control-switch')).to.be.present();
      });
    });

    context('when the connection is an srv record', () => {
      const connection = { isSrvRecord: true };
      const component = mount(<SRVInput currentConnection={connection} />);

      it('renders the wrapper div', () => {
        expect(component.find('.form-item')).to.be.present();
      });

      it('renders the label', () => {
        expect(component.find('.form-item-label')).to.have.text('SRV Record');
      });

      it('enables the switch', () => {
        expect(component.find('input')).to.have.prop('checked', true);
      });
    });
  });
});
