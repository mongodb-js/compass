import { mount } from 'enzyme';
import React from 'react';

import ConnectionStringInput from './connection-string-input';

describe('ConnectionStringInput [Component]', () => {
  context('when input was not changed', () => {
    context('when URI is editable', () => {
      const customUrl = '';
      const isURIEditable = true;
      let component;

      beforeEach(() => {
        component = mount(
          <ConnectionStringInput
            customUrl={customUrl}
            isURIEditable={isURIEditable}
          />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders an editable connection string input with placeholder', () => {
        const placeholder =
          'e.g. mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin';
        const connectionString = component.find(
          'input[name="connectionString"]'
        );

        expect(connectionString).to.have.value('');
        expect(connectionString.hasClass('disabled')).to.equal(false);
        expect(connectionString.prop('placeholder')).to.equal(placeholder);
      });
    });

    context('when URI is not editable', () => {
      const customUrl = '';
      const isURIEditable = false;
      let component;

      beforeEach(() => {
        component = mount(
          <ConnectionStringInput
            customUrl={customUrl}
            isURIEditable={isURIEditable}
          />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders a read-only connection string', () => {
        const connectionString = component.find(
          'input[name="connectionString"]'
        );

        expect(connectionString.hasClass('disabled')).to.equal(false);
      });
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
      expect(component.find('input[name="connectionString"]')).to.have.value(
        customUrl
      );
    });
  });
});
