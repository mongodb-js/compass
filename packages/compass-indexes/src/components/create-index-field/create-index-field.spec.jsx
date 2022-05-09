import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import Select from 'react-select-plus';

import CreateIndexField from '../create-index-field';

const noop = () => {};

function renderCreateIndexField(optionalProps) {
  return mount(
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
      const typeSelectComponent = component.find(Select).at(1);
      expect(typeSelectComponent).to.be.present();
      expect(typeSelectComponent.props().options).to.not.deep.contain({
        value: 'columnstore',
        type: 'columnstore',
      });
    });
  });

  describe('server version 6.1.0 with env variable COMPASS_COLUMNSTORE_INDEXES = true', function () {
    let initialEnvVars;

    before(function () {
      initialEnvVars = Object.assign({}, process.env);

      process.env.COMPASS_COLUMNSTORE_INDEXES = 'true';
    });

    after(function () {
      process.env = initialEnvVars;
    });

    beforeEach(function () {
      component = renderCreateIndexField({
        serverVersion: '6.1.0',
      });
    });
    it('shows columnstore indexes as a selectable index type', function () {
      const typeSelectComponent = component.find(Select).at(1);
      expect(typeSelectComponent).to.be.present();
      expect(typeSelectComponent.props().options).to.deep.contain({
        value: 'columnstore',
        label: 'columnstore',
      });
    });
  });
});
