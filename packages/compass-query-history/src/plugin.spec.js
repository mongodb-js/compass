import React from 'react';
import { shallow } from 'enzyme';
import { StoreConnector } from 'hadron-react-components';

// Mockout some of QueryHistoryPlugin's dependencies via the webpack inject-loader
import QueryHistoryPluginInjector from 'inject-loader!./plugin';

// We have to mock out these dependencies because these stores rely on the Ampersand models
// which make a reference to electron.remote.app which is undefined if run outside the context
// of the electron renderer - which would result in an error being thrown in these component
// unit tests.

// eslint-disable-next-line new-cap
const QueryHistoryPlugin = QueryHistoryPluginInjector({
  'components/query-history': () => (<div data-test-id="mock-sidebar" />),
  'stores': {
    QueryHistoryStore: {}
  }
}).default;

describe('QueryHistory [Plugin]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<QueryHistoryPlugin actions={{}} />);
  });

  afterEach(() => {
    component = null;
  });

  describe('#rendering', () => {
    it('should contain a <StoreConnector /> with a store prop', function() {
      const node = component.find(StoreConnector).first();
      expect(node.prop('store')).to.be.an('object');
    });
  });
});
