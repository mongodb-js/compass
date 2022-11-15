import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { Select } from '@mongodb-js/compass-components';

import Collation from '.';

describe('CollationFields [Component]', function () {
  let component;
  let changeCollationOptionSpy;

  beforeEach(function () {
    changeCollationOptionSpy = sinon.spy();
    component = mount(
      <Collation
        collation={{}}
        changeCollationOption={changeCollationOptionSpy}
      />
    );
  });

  afterEach(function () {
    changeCollationOptionSpy = null;
    component = null;
  });

  it('renders the collation option dropdowns', function () {
    expect(component.find(Select)).to.have.length(9);
  });
});
