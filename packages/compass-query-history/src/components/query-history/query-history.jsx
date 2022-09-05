import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import mongodbns from 'mongodb-ns';
import { StoreConnector } from 'hadron-react-components';

// Components
import { Toolbar } from '../toolbar/toolbar';
import { RecentList } from '../recent';
import { FavoriteList } from '../favorite';

// Stores
import styles from './query-history.module.less';
import { css } from '@mongodb-js/compass-components';

const componentStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  width: '335px',
  height: '100%',
});

const innerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: '100%',
});

class QueryHistory extends PureComponent {
  static displayName = 'QueryHistory';

  static propTypes = {
    actions: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    showing: PropTypes.oneOf(['recent', 'favorites']),
    // TODO(COMPASS-5679): After we enable the toolbars feature flag,
    // we can remove the collapsed boolean and make `onClose` required.
    onClose: PropTypes.func,
    collapsed: PropTypes.bool,
    ns: PropTypes.object,
  };

  static defaultProps = {
    showing: 'recent',
    collapsed: true,
    ns: mongodbns(''),
  };

  renderFavorites = () => (
    <StoreConnector
      store={this.props.store.localAppRegistry.getStore(
        'QueryHistory.FavoriteListStore'
      )}
    >
      <FavoriteList
        data-test-id="query-history-list-favorites"
        ns={this.props.ns}
        actions={this.props.actions}
        zeroStateTitle="Favorite a query to see it saved here!"
      />
    </StoreConnector>
  );

  renderRecents = () => (
    <StoreConnector
      store={this.props.store.localAppRegistry.getStore(
        'QueryHistory.RecentListStore'
      )}
    >
      <RecentList
        data-test-id="query-history-list-recent"
        ns={this.props.ns}
        actions={this.props.actions}
        zeroStateTitle="Run a query to see it saved here!"
      />
    </StoreConnector>
  );

  render() {
    const { collapsed, ns, showing, onClose, actions } = this.props;

    if (!onClose && collapsed) {
      // TODO(COMPASS-5679): After we enable the toolbars feature flag,
      // we can remove the collapsed boolean and make `onClose` required.
      // And remove this condition.
      return null;
    }

    return (
      <div
        data-test-id="query-history"
        className={onClose ? componentStyle : styles['component-legacy']}
      >
        <div className={innerStyle}>
          <Toolbar
            actions={actions}
            showing={showing}
            onClose={onClose}
            namespace={ns}
          />

          {showing === 'favorites' ? this.renderFavorites() : null}
          {showing === 'recent' ? this.renderRecents() : null}
        </div>
      </div>
    );
  }
}

export default QueryHistory;
export { QueryHistory };
