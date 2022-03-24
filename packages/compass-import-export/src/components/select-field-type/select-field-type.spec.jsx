import React from 'react';
import { mount } from 'enzyme';
import SelectFieldType from './';
import sinon from 'sinon';
import { expect } from 'chai';

let onSelectFieldTypeChangedSpy;

describe('SelectFieldType [Component]', function () {
  let component;

  before(function () {
    onSelectFieldTypeChangedSpy = sinon.spy();
    component = mount(
      <SelectFieldType
        fileType="csv"
        selectedType="string"
        onChange={onSelectFieldTypeChangedSpy}
      />
    );
  });

  it('should render default option', function () {
    expect(component.find('option[value="default"]')).to.not.be.present();
  });

  it('should select string value', function () {
    expect(component.find('select[defaultValue="string"]')).to.be.present();
  });

  after(function () {
    component = null;
    onSelectFieldTypeChangedSpy = null;
  });
});
