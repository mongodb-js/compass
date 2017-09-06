import React from 'react';
import { shallow } from 'enzyme';

// Mockout some of QueryHistory's dependencies via the webpack inject-loader
import QueryHistoryInjector from 'inject-loader!components/query-history/query-history';

// We have to mock out these dependencies because these stores rely on the Ampersand models
// which make a reference to electron.remote.app which is undefined if run outside the context
// of the electron renderer - which would result in an error being thrown in these component
// unit tests.

// eslint-disable-next-line new-cap
const { QueryHistory } = QueryHistoryInjector({
  'stores': {
    HeaderStore: {},
    RecentListStore: {},
    FavoriteListStore: {}
  }
});

import Header from 'components/header';
import { RecentList } from 'components/recent';
import { FavoriteList } from 'components/favorite';

import styles from './query-history.less';

describe('QueryHistory [Component]', () => {
  const actions = {};
  let component;

  afterEach(() => {
    component = null;
  });

  describe('#rendering', () => {
    it('should not render the query history component if it is collapsed', () => {
      component = shallow(<QueryHistory actions={actions} collapsed />);

      const node = component.find('[data-test-id="query-history"]');
      expect(node).to.have.length(0);
    });

    it('should render the query history component if it is not collapsed', () => {
      component = shallow(<QueryHistory actions={actions} collapsed={false} />);

      const node = component.find('[data-test-id="query-history"]');
      expect(node).to.have.length(1);
      expect(node.hasClass(styles.component)).to.equal(true);
    });

    it('should render the header component', () => {
      component = shallow(<QueryHistory actions={actions} collapsed={false} />);

      const node = component.find('[data-test-id="query-history-header"]');
      expect(node).to.have.length(1);
      expect(node).to.have.type(Header);
    });

    it('should render the recent queries list by default', () => {
      component = shallow(<QueryHistory actions={actions} collapsed={false} />);

      const node = component.find('[data-test-id="query-history-list-recent"]');
      expect(node).to.have.length(1);
      expect(node).to.have.type(RecentList);
    });

    it('should render the favorite queries list when the "showing" prop is set to favorites', () => {
      component = shallow(<QueryHistory actions={actions} collapsed={false} showing="favorites" />);

      const node = component.find('[data-test-id="query-history-list-favorites"]');
      expect(node).to.have.length(1);
      expect(node).to.have.type(FavoriteList);
    });
  });
});
