import { mount } from 'enzyme';
import { expect } from 'chai';
import * as sinon from 'sinon';
import React from 'react';
import SelectFieldType from './';
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
