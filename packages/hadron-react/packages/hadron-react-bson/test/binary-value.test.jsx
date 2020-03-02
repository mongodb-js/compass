import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Binary } from 'bson';
import { BinaryValue } from '../';

const TESTING_BASE64 = Buffer.from('testing').toString('base64');

describe('<BinaryValue />', () => {
  context('when the type is an old uuid', () => {
    const binary = new Binary('testing', 3);
    const component = shallow(<BinaryValue type="Binary" value={binary} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-binary')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal(`Binary('${TESTING_BASE64}', 3)`);
    });

    it('sets the value', () => {
      expect(component.text()).to.equal(`Binary('${TESTING_BASE64}', 3)`);
    });
  });

  context('when the type is a new uuid', () => {
    const buffer = Buffer.from('3b241101e2bb42558caf4136c566a962', 'hex');
    const binary = new Binary(buffer, 4);
    const component = shallow(<BinaryValue type="Binary" value={binary} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-binary')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal(`UUID('3b241101-e2bb-4255-8caf-4136c566a962')`);
    });

    it('sets the value', () => {
      expect(component.text()).to.equal(`UUID('3b241101-e2bb-4255-8caf-4136c566a962')`);
    });
  });

  context('when the type is a GUID', () => {
    const buffer = Buffer.from('3b241101e2bb42558caf4136c566a962', 'hex');
    const binary = new Binary(buffer, 4);
    const component = shallow(<BinaryValue type="Binary" value={binary} />);

    it('title is base64 encoded', () => {
      expect(component.props().title).to.equal(`UUID('3b241101-e2bb-4255-8caf-4136c566a962')`);
    });

    it('value is base64 encoded', () => {
      expect(component.text()).to.equal(`UUID('3b241101-e2bb-4255-8caf-4136c566a962')`);
    });
  });

  context('when the type is not a uuid', () => {
    const binary = new Binary('testing', 2);
    const component = shallow(<BinaryValue type="Binary" value={binary} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-binary')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('Binary(\'dGVzdGluZw==\', 2)');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('Binary(\'dGVzdGluZw==\', 2)');
    });
  });

  context('when the type is FLE', () => {
    const binary = new Binary('testing', 6);
    const component = shallow(<BinaryValue type="Binary" value={binary} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-binary')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('This field is encrypted');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('*********');
    });
  });
});
