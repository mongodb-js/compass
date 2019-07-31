import React from 'react';
import { mount } from 'enzyme';
import ConnectionStringInput from './connection-string-input';

describe('ConnectionStringInput [Component]', () => {
  context('when input was not changed', () => {
    const customUrl = '';
    let component;

    beforeEach(() => {
      component = mount(<ConnectionStringInput customUrl={customUrl} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders connection string input with no value', () => {
      expect(component.find('input[name="connectionString"]')).to.have.value('');
    });

    it('renders connection string input with placeholder', () => {
      const placeholder = 'e.g. mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin';
      const connectionString = component
        .find('input[name="connectionString"]')
        .prop('placeholder');

      expect(connectionString).to.equal(placeholder);
    });
  });

  context('when input was changed', () => {
    const customUrl = 'mongodb://localhost/?compressors=snappy,zlib';
    let component;

    beforeEach(() => {
      component = mount(<ConnectionStringInput customUrl={customUrl} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders connection string input with the custom value', () => {
      expect(component.find('input[name="connectionString"]')).to.have.value(customUrl);
    });
  });
});
