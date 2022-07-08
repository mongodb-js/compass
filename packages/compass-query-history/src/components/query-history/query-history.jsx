import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import mongodbns from 'mongodb-ns';

// Components
import Header from '../header';
import { RecentList } from '../recent';
import { FavoriteList } from '../favorite';

// Stores
import styles from './query-history.module.less';

class QueryHistory extends PureComponent {
  static displayName = 'QueryHistory';

  static propTypes = {
    actions: PropTypes.object.isRequired,
    collapsed: PropTypes.bool,
    ns: PropTypes.object
  };

  static defaultProps = {
    collapsed: true,
    ns: mongodbns('')
  };

  state = {
    currentView: 'Recent'
  }

  renderFavorites = () => (
    <FavoriteList
      data-test-id="query-history-list-favorites"
      ns={this.props.ns}
      zeroStateTitle="Favorite a query to see it saved here!"
    />
  );

  renderRecents = () => (
    <RecentList
      data-test-id="query-history-list-recent"
      ns={this.props.ns}
      zeroStateTitle="Run a query to see it saved here!"
    />
  );

  render() {
    const { collapsed } = this.props;
    const { currentView } = this.state;

    if (collapsed) {
      return null;
    }

    return (
      <div
        data-test-id="query-history"
        className={styles.component}
      >
        <div className={styles.inner}>
          <Header
            data-test-id="query-history-header"
            onViewSwitchClick={(newVal) => {
              this.setState({ currentView: newVal });
            }}
            currentView={currentView}
            onCollapseClick={() => {
              this.props.actions.collapse();
            }}
          />

          {currentView === 'Favorites' ? this.renderFavorites() : null}
          {currentView === 'Recent' ? this.renderRecents() : null}
        </div>
      </div>
    );
  }
}

export default QueryHistory;
export { QueryHistory };
