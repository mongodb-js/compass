import React from 'react';
import { shallow } from 'enzyme';
import { Code } from '@mongodb-js/compass-components';
import { expect } from 'chai';

import Query from '../query';

describe('Query [Component]', function() {
  const title = 'Testing';
  const attributes = { filter: { name: 'test' }};
  let component;

  beforeEach(function() {
    component = shallow(<Query title={title} attributes={attributes} />);
  });

  afterEach(function() {
    component = null;
  });

  describe('#rendering', function() {
    it('renders the attributes list', function() {
      const node = component.find('[data-test-id="query-history-query-attributes"]');
      expect(node).to.have.type('button');
    });

    it('renders the attribute label', function() {
      const node = component.find('[data-test-id="query-history-query-label"]');
      expect(node).to.have.text('filter');
    });

    it('renders the formatted attributes with a Code component', function() {
      const node = component.find('[data-test-id="query-history-query-code"]');
      expect(node).to.have.type(Code);
    });
  });
});
