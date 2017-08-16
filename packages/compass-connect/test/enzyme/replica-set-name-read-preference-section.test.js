const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const ReplicaSetNameReadPreferenceSection =
  require('../../src/components/replica-set-name-read-preference-section');

chai.use(chaiEnzyme());

describe('<ReplicaSetNameReadPreferenceSection />', () => {
  describe('#render', () => {
    const connection = {
      replica_set_name: 'myrs',
      read_preference: 'secondary'
    };
    const component = mount(
      <ReplicaSetNameReadPreferenceSection currentConnection={connection} />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.form-group')).to.be.present();
    });

    it('renders the replica set name', () => {
      expect(component.find('input[name="replica_set_name"]')).to.have.value('myrs');
    });

    it('renders the read preference', () => {
      expect(component.find('select')).to.have.value('secondary');
    });
  });
});
