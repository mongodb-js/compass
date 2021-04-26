import React from 'react';
import { expect } from '../../../testing/chai';
import { shallow } from '../../../testing/enzyme';

import { ShowCollectionsOutput } from './show-collections-output';

describe('ShowCollectionsOutput', () => {
  it('renders no show dbs output if value is empty', () => {
    const wrapper = shallow(<ShowCollectionsOutput value={[]} />);

    expect(wrapper.text()).to.equal('');
  });

  it('renders a ShowCollectionsOutput for each element in value', () => {
    const wrapper = shallow(<ShowCollectionsOutput value={[
      'nested_documents', 'decimal128', 'coll', 'people_imported', 'cats'
    ]} />);

    expect(wrapper.text()).to.contain('nested_documents\ndecimal128\ncoll\npeople_imported\ncats');
  });
});
