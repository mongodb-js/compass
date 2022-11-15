import React from 'react';
import { render, screen } from '@testing-library/react';
import sinon from 'sinon';
import { expect } from 'chai';

import { SelectFieldType } from './select-field-type';

describe('SelectFieldType [Component]', function () {
  let onSelectFieldTypeChangedSpy;

  beforeEach(function () {
    onSelectFieldTypeChangedSpy = sinon.spy();
    render(
      <SelectFieldType
        selectedType="string"
        onChange={onSelectFieldTypeChangedSpy}
      />
    );
  });

  afterEach(function () {
    onSelectFieldTypeChangedSpy = null;
  });

  it('should render the select', function () {
    expect(screen.getByLabelText('Field type')).to.be.visible;
  });

  it('should not select a not string value', function () {
    expect(screen.queryByText('Number')).to.not.exist;
  });
});
