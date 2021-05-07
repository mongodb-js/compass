import React from 'react';
import { shallow } from 'enzyme';

import Query from 'components/query';
import Code from 'components/code';

describe('Query [Component]', () => {
  const title = 'Testing';
  const attributes = { filter: { name: 'test' }};
  let component;

  beforeEach(() => {
    component = shallow(<Query title={title} attributes={attributes} />);
  });

  afterEach(() => {
    component = null;
  });

  describe('#rendering', () => {
    it('renders the attributes list', () => {
      const node = component.find('[data-test-id="query-history-query-attributes"]');
      expect(node).to.have.type('ul');
    });

    it('renders the attribute label', () => {
      const node = component.find('[data-test-id="query-history-query-label"]');
      expect(node).to.have.text('filter');
    });

    it('renders the formatted attributes with a Code component', () => {
      const node = component.find('[data-test-id="query-history-query-code"]');
      expect(node).to.have.type(Code);
    });
  });
});
