import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import CreateIndexField from '../create-index-field';

const noop = () => {};

function renderCreateIndexField(optionalProps) {
  return shallow(
    <CreateIndexField
      fields={[]}
      field={{}}
      idx={0}
      serverVersion="5.0.0"
      disabledFields={[]}
      isRemovable
      addField={noop}
      removeField={noop}
      updateFieldName={noop}
      updateFieldType={noop}
      createNewIndexField={noop}
      {...optionalProps}
    />
  );
}

describe('create-index-field [Component]', function () {
  let component;

  afterEach(function () {
    component?.unmount();
    component = null;
  });

  describe('server version 5.0.0', function () {
    beforeEach(function () {
      component = renderCreateIndexField({
        serverVersion: '5.0.0',
      });
    });
    it('does not have columnstore indexes as a selectable index type', function () {
      const typeSelectComponent = component.find('[name="field-type"]');
      expect(typeSelectComponent).to.be.present();
      expect(typeSelectComponent).to.not.contain('columnstore');
    });
  });

  describe('server version 6.1.0', function () {
    beforeEach(function () {
      component = renderCreateIndexField({
        serverVersion: '6.1.0',
      });
    });
    it('shows columnstore indexes as a selectable index type', function () {
      const typeSelectComponent = component.find('[name="field-type"]');
      expect(typeSelectComponent).to.be.present();
      expect(typeSelectComponent).to.contain('columnstore');
    });
  });
});
