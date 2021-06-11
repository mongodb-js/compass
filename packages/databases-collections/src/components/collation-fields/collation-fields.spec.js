import React from 'react';
import { mount } from 'enzyme';
import { Select } from '@leafygreen-ui/select';

import Collation from '.';

describe('CollationFields [Component]', () => {
  let component;
  let changeCollationOptionSpy;

  beforeEach(() => {
    changeCollationOptionSpy = sinon.spy();
    component = mount(
      <Collation
        collation={{}}
        changeCollationOption={changeCollationOptionSpy}
      />
    );
  });

  afterEach(() => {
    changeCollationOptionSpy = null;
    component = null;
  });

  it('renders the collation option dropdowns', () => {
    expect(component.find(Select)).to.have.length(9);
  });
});
