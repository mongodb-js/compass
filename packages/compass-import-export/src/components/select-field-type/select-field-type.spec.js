import React from 'react';
import { mount } from 'enzyme';
import SelectFieldType from './';

let onSelectFieldTypeChangedSpy;

describe('SelectFieldType [Component]', () => {
  let component;

  before(() => {
    onSelectFieldTypeChangedSpy = sinon.spy();
    component = mount(
      <SelectFieldType
        fileType="csv"
        selectedType="string"
        onChange={onSelectFieldTypeChangedSpy}
      />
    );
  });

  it('should render default option', () => {
    expect(component.find('option[value="default"]')).to.not.be.present();
  });

  it('should select string value', () => {
    expect(component.find('select[defaultValue="string"]')).to.be.present();
  });

  after(() => {
    component = null;
    onSelectFieldTypeChangedSpy = null;
  });
});
