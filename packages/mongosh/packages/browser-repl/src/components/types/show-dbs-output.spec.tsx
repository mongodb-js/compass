import React from 'react';
import { expect } from '../../../testing/chai';
import { shallow } from '../../../testing/enzyme';

import { ShowDbsOutput } from './show-dbs-output';

describe('ShowDbsOutput', () => {
  it('renders no show dbs output if value is empty', () => {
    const wrapper = shallow(<ShowDbsOutput value={[]} />);

    expect(wrapper.text()).to.equal('');
  });

  it('renders a ShowDbsOutput for each element in value', () => {
    const wrapper = shallow(<ShowDbsOutput value={[
      { name: 'admin', sizeOnDisk: 45056, empty: false },
      { name: 'dxl', sizeOnDisk: 8192, empty: false },
      { name: 'supplies', sizeOnDisk: 2236416, empty: false },
      { name: 'test', sizeOnDisk: 5664768, empty: false },
      { name: 'test', sizeOnDisk: 599999768000, empty: false }
    ]} />);

    expect(wrapper.text()).to.contain('admin     45.1 kB\ndxl       8.19 kB\nsupplies  2.24 MB\ntest      5.66 MB\ntest       600 GB');
  });
});
